using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.JSInterop;
using SCMS.Shared;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared.Contracts.Auth;
using SCMS.Shared.Contracts.Dashboards;
using SCMS.Shared.Contracts.Diseases;
using SCMS.Shared.Contracts.FollowUps;

using SCMS.Shared.Contracts.Medicines;
using SCMS.Shared.Contracts.Notifications;
using SCMS.Shared.Contracts.Patients;
using SCMS.Shared.Contracts.Payments;
using SCMS.Shared.Contracts.Prescriptions;

namespace SCMS.Web.Services
{
    public class ApiClient
    {
        private readonly HttpClient _http;
        private readonly TokenStore _tokenStore;
        private readonly ScmsAuthenticationStateProvider _authState;
        private readonly IJSRuntime _js;

        public ApiClient(HttpClient http, TokenStore tokenStore, ScmsAuthenticationStateProvider authState, IJSRuntime js)
        {
            _http = http;
            _tokenStore = tokenStore;
            _authState = authState;
            _js = js;
        }

        public string ApiBaseAddress => _http.BaseAddress?.ToString().TrimEnd('/') ?? string.Empty;

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            var result = await PostAsync<LoginRequest, AuthResponse>("api/auth/login", request, authorize: false);
            if (result.IsSuccess && result.Data != null)
            {
                await _tokenStore.SaveAsync(result.Data);
                _authState.NotifyAuthenticationChanged();
            }

            return result;
        }

        public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            var result = await PostAsync<RegisterRequest, AuthResponse>("api/auth/register", request, authorize: false);
            if (result.IsSuccess && result.Data != null)
            {
                await _tokenStore.SaveAsync(result.Data);
                _authState.NotifyAuthenticationChanged();
            }

            return result;
        }

        public async Task<Result<AuthResponse>> RefreshAsync()
        {
            var refreshToken = await _tokenStore.GetRefreshTokenAsync();
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return Result<AuthResponse>.Failure("No refresh token is available.");
            }

            var result = await PostAsync<RefreshTokenRequest, AuthResponse>(
                "api/auth/refresh",
                new RefreshTokenRequest { RefreshToken = refreshToken },
                authorize: false);

            if (result.IsSuccess && result.Data != null)
            {
                await _tokenStore.SaveAsync(result.Data);
                _authState.NotifyAuthenticationChanged();
            }

            return result;
        }

        public async Task LogoutAsync()
        {
            // Logout endpoint is not implemented on the backend;
            // just clear local tokens and let the server reject expired ones.
            await _tokenStore.ClearAsync();
            _authState.NotifyAuthenticationChanged();
        }

        public Task<Result<DoctorDashboardResponse>> DoctorDashboardAsync()
            => GetAsync<DoctorDashboardResponse>("api/dashboards/dashboard");

        public Task<Result<PatientDashboardResponse>> PatientDashboardAsync()
            => GetAsync<PatientDashboardResponse>("api/dashboards/patient-dashboard");

        public Task<PagedResult<AppointmentDetailsResponse>> AppointmentsAsync(DateTime? start = null, DateTime? end = null, string? status = null, int? patientId = null, int pageSize = 50)
            => GetPagedAsync<AppointmentDetailsResponse>($"api/appointments?{Query(("startDate", start?.ToString("O")), ("endDate", end?.ToString("O")), ("status", status), ("patientId", patientId?.ToString()), ("pageSize", pageSize.ToString()))}");

        public Task<Result<BookAppointmentResponse>> BookAppointmentAsync(BookAppointmentRequest request)
            => PostAsync<BookAppointmentRequest, BookAppointmentResponse>("api/appointments", request);

        public Task<Result<AppointmentDetailsResponse>> UpdateAppointmentStatusAsync(int id, string status, string? notes = null)
            => PatchAsync<UpdateAppointmentStatusRequest, AppointmentDetailsResponse>($"api/appointments/{id}/status", new UpdateAppointmentStatusRequest { Status = status, Notes = notes });

        public Task<Result<AppointmentDetailsResponse>> RescheduleAppointmentAsync(int id, RescheduleAppointmentRequest request)
            => PostAsync<RescheduleAppointmentRequest, AppointmentDetailsResponse>($"api/appointments/{id}/reschedule", request);

        public Task<Result<AppointmentQueueStatusResponse>> QueueStatusAsync(int appointmentId)
            => GetAsync<AppointmentQueueStatusResponse>($"api/appointments/{appointmentId}/queue-status");

        public Task<Result<AppointmentDetailsResponse>> CallNextPatientAsync()
            => PostAsync<object, AppointmentDetailsResponse>("api/appointments/call-next", new { });

        public Task<PagedResult<MedicineSearchResponse>> SearchMedicinesAsync(string? query = null, int pageSize = 50)
            => GetPagedAsync<MedicineSearchResponse>($"api/medicines?{Query(("query", query), ("pageSize", pageSize.ToString()))}");

        public Task<PagedResult<InventoryAlertResponse>> InventoryAlertsAsync()
            => GetPagedAsync<InventoryAlertResponse>("api/medicines/alerts?pageSize=100");

        public Task<Result> QuarantineExpiredBatchesAsync()
            => PostPlainAsync("api/medicines/quarantine-expired", new { });

        public Task<Result<List<MedicineCategoryResponse>>> GetMedicineCategoriesAsync()
            => GetAsync<List<MedicineCategoryResponse>>("api/medicines/categories");

        public async Task<Result<MedicineSearchResponse>> CreateMedicineAsync(CreateMedicineRequest request, byte[]? imageBytes, string? fileName, string? contentType = null)
        {
            try
            {
                await EnsureAuthorizationAsync();
                using var content = new MultipartFormDataContent();
                
                content.Add(new StringContent(request.Name), "Name");
                if (request.Description != null)
                {
                    content.Add(new StringContent(request.Description), "Description");
                }
                if (request.CategoryId.HasValue)
                {
                    content.Add(new StringContent(request.CategoryId.Value.ToString()), "CategoryId");
                }
                content.Add(new StringContent(request.UnitPrice.ToString(System.Globalization.CultureInfo.InvariantCulture)), "UnitPrice");

                if (imageBytes != null && !string.IsNullOrWhiteSpace(fileName))
                {
                    var fileContent = new ByteArrayContent(imageBytes);
                    fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
                    content.Add(fileContent, "image", fileName);
                }

                var response = await _http.PostAsync("api/medicines", content);
                return await ReadResultAsync<MedicineSearchResponse>(response);
            }
            catch (HttpRequestException ex)
            {
                return Result<MedicineSearchResponse>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        public async Task<Result<MedicineSearchResponse>> UpdateMedicineAsync(int id, UpdateMedicineRequest request, byte[]? imageBytes, string? fileName, string? contentType = null)
        {
            try
            {
                await EnsureAuthorizationAsync();
                using var content = new MultipartFormDataContent();
                
                content.Add(new StringContent(request.Name), "Name");
                if (request.Description != null)
                {
                    content.Add(new StringContent(request.Description), "Description");
                }
                if (request.CategoryId.HasValue)
                {
                    content.Add(new StringContent(request.CategoryId.Value.ToString()), "CategoryId");
                }
                content.Add(new StringContent(request.UnitPrice.ToString(System.Globalization.CultureInfo.InvariantCulture)), "UnitPrice");
                content.Add(new StringContent(request.RemoveImage.ToString().ToLower()), "RemoveImage");

                if (imageBytes != null && !string.IsNullOrWhiteSpace(fileName))
                {
                    var fileContent = new ByteArrayContent(imageBytes);
                    fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType ?? "application/octet-stream");
                    content.Add(fileContent, "image", fileName);
                }

                var response = await _http.PutAsync($"api/medicines/{id}", content);
                return await ReadResultAsync<MedicineSearchResponse>(response);
            }
            catch (HttpRequestException ex)
            {
                return Result<MedicineSearchResponse>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        public Task<Result> DeleteMedicineAsync(int id)
            => DeletePlainAsync($"api/medicines/{id}");

        // ── Medicine Batch CRUD ──

        public Task<PagedResult<BatchDetailResponse>> GetBatchesAsync(
            string? query = null, string? status = null, int? medicineId = null,
            string? sortBy = null, bool sortDescending = false, int pageNumber = 1, int pageSize = 20)
            => GetPagedAsync<BatchDetailResponse>($"api/medicines/batches?{Query(
                ("query", query), ("status", status), ("medicineId", medicineId?.ToString()),
                ("sortBy", sortBy), ("sortDescending", sortDescending ? "true" : null),
                ("pageNumber", pageNumber.ToString()), ("pageSize", pageSize.ToString()))}");

        public Task<Result<BatchDetailResponse>> GetBatchByIdAsync(int id)
            => GetAsync<BatchDetailResponse>($"api/medicines/batches/{id}");

        public Task<Result<BatchDetailResponse>> CreateBatchAsync(CreateBatchRequest request)
            => PostAsync<CreateBatchRequest, BatchDetailResponse>("api/medicines/batches", request);

        public Task<Result<BatchDetailResponse>> UpdateBatchAsync(int id, UpdateBatchRequest request)
            => PutAsync<UpdateBatchRequest, BatchDetailResponse>($"api/medicines/batches/{id}", request);

        public Task<Result> DeleteBatchAsync(int id, bool force = false)
            => DeletePlainAsync($"api/medicines/batches/{id}?force={force}");

        public Task<PagedResult<PaymentDetailsResponse>> PaymentsAsync(string? status = null)
            => GetPagedAsync<PaymentDetailsResponse>($"api/payments?{Query(("status", status), ("pageSize", "100"))}");

        public Task<Result<PaymentDetailsResponse>> ApprovePaymentAsync(int id)
            => PostAsync<object, PaymentDetailsResponse>($"api/payments/{id}/approve", new { });

        public Task<Result<PaymentDetailsResponse>> SubmitManualPaymentProofAsync(ManualPaymentProofRequest request)
            => PostAsync<ManualPaymentProofRequest, PaymentDetailsResponse>("api/payments/manual-proof", request);

        public Task<Result<PaymentDetailsResponse>> ProcessPaymentCallbackAsync(ProcessPaymentCallbackRequest request)
            => PostAsync<ProcessPaymentCallbackRequest, PaymentDetailsResponse>("api/payments/gateway-callback", request);

        public Task<PagedResult<PatientProfileResponse>> PatientProfilesAsync(int pageSize = 50)
            => GetPagedAsync<PatientProfileResponse>($"api/patients?pageSize={pageSize}");

        public Task<Result<PatientProfileResponse>> AddPatientProfileAsync(PatientProfileRequest request)
            => PostAsync<PatientProfileRequest, PatientProfileResponse>("api/patients", request);

        public Task<Result<PatientProfileResponse>> PatientProfileAsync(int id)
            => GetAsync<PatientProfileResponse>($"api/patients/patients/{id}");

        public Task<Result<PatientHistoryResponse>> PatientHistoryAsync(int patientId)
            => GetAsync<PatientHistoryResponse>($"api/patients/{patientId}/history");

        public Task<Result<MedicalSummaryResponse>> MedicalSummaryAsync(int patientId)
            => GetAsync<MedicalSummaryResponse>($"api/patients/{patientId}/summary");

        public Task<Result<string>> MedicalSummaryHtmlAsync(int patientId)
            => GetStringAsync($"api/patients/{patientId}/summary/html");



        public Task<PagedResult<FollowUpResponse>> FollowUpsAsync(int? patientId = null)
            => GetPagedAsync<FollowUpResponse>($"api/followups?{Query(("patientId", patientId?.ToString()), ("pageSize", "100"))}");

        public Task<Result<FollowUpResponse>> CreateFollowUpAsync(FollowUpRequest request)
            => PostAsync<FollowUpRequest, FollowUpResponse>("api/followups", request);

        public Task<Result<FollowUpResponse>> CompleteFollowUpAsync(int id)
            => PostAsync<object, FollowUpResponse>($"api/followups/{id}/complete", new { });

        public Task<PagedResult<DiseaseResponse>> DiseasesAsync(string? query = null)
            => GetPagedAsync<DiseaseResponse>($"api/diseases?{Query(("query", query), ("pageSize", "100"))}");

        public Task<Result<DiseaseResponse>> CreateDiseaseAsync(CreateDiseaseRequest request)
            => PostAsync<CreateDiseaseRequest, DiseaseResponse>("api/diseases", request);

        public Task<Result<DiseaseResponse>> UpdateDiseaseAsync(UpdateDiseaseRequest request)
            => PutAsync<UpdateDiseaseRequest, DiseaseResponse>("api/diseases", request);

        public Task<Result<bool>> DeactivateDiseaseAsync(int id)
            => DeleteAsync<bool>($"api/diseases/{id}");

        public Task<PagedResult<PrescriptionTemplateResponse>> PrescriptionTemplatesAsync(int? diseaseId = null)
            => GetPagedAsync<PrescriptionTemplateResponse>($"api/prescriptions/templates?{Query(("diseaseId", diseaseId?.ToString()), ("pageSize", "100"))}");

        public Task<Result<PrescriptionTemplateResponse>> SavePrescriptionTemplateAsync(SaveTemplateRequest request)
            => PostAsync<SaveTemplateRequest, PrescriptionTemplateResponse>("api/prescriptions/templates", request);

        public Task<Result<PrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request)
            => PostAsync<CreatePrescriptionRequest, PrescriptionResponse>("api/prescriptions", request);

        public Task<PagedResult<PrescriptionResponse>> PrescriptionsAsync(int? patientId = null)
            => GetPagedAsync<PrescriptionResponse>($"api/prescriptions?{Query(("patientId", patientId?.ToString()), ("pageSize", "100"))}");

        public Task<Result<PrescriptionResponse>> PrescriptionAsync(int id)
            => GetAsync<PrescriptionResponse>($"api/prescriptions/prescriptions/{id}");

        // ── Notifications ──

        public Task<PagedResult<NotificationResponse>> GetNotificationsAsync(bool includeAll = false, int pageSize = 50)
            => GetPagedAsync<NotificationResponse>($"api/notifications?{Query(("includeAll", includeAll ? "true" : null), ("pageSize", pageSize.ToString()))}");

        public Task<Result<NotificationResponse>> CreateNotificationAsync(CreateNotificationRequest request)
            => PostAsync<CreateNotificationRequest, NotificationResponse>("api/notifications", request);

        public Task<Result> MarkNotificationAsReadAsync(int id)
            => PostPlainAsync($"api/notifications/{id}/read", new { });

        public string DownloadUrl(string relativePath)
            => $"{ApiBaseAddress}/{relativePath.TrimStart('/')}";

        public async Task<Result> DownloadFileAsync(string relativePath, string fileName)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.GetAsync(relativePath);
                if (!response.IsSuccessStatusCode)
                {
                    return await ReadPlainResultAsync(response);
                }

                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/pdf";
                var bytes = await response.Content.ReadAsByteArrayAsync();
                await _js.InvokeVoidAsync("scmsDownloadFile", fileName, contentType, Convert.ToBase64String(bytes));
                return Result.Success("Download ready.");
            }
            catch (HttpRequestException ex)
            {
                return Result.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task EnsureAuthorizationAsync()
        {
            var token = await _tokenStore.GetAccessTokenAsync();
            _http.DefaultRequestHeaders.Authorization = string.IsNullOrWhiteSpace(token)
                ? null
                : new AuthenticationHeaderValue("Bearer", token);
        }

        private async Task<Result<TData>> GetAsync<TData>(string url)
        {
            try
            {
                await EnsureAuthorizationAsync();
                return await ReadResultAsync<TData>(await _http.GetAsync(url));
            }
            catch (HttpRequestException ex)
            {
                return Result<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<PagedResult<TData>> GetPagedAsync<TData>(string url)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.GetAsync(url);
                return await ReadPagedResultAsync<TData>(response);
            }
            catch (HttpRequestException ex)
            {
                return PagedResult<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result<string>> GetStringAsync(string url)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.GetAsync(url);
                var body = await response.Content.ReadAsStringAsync();
                return response.IsSuccessStatusCode
                    ? Result<string>.Success(body)
                    : Result<string>.Failure(CreateApiFailureMessage(response, body));
            }
            catch (HttpRequestException ex)
            {
                return Result<string>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result> PostPlainAsync<TRequest>(string url, TRequest request)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.PostAsJsonAsync(url, request);
                return await ReadPlainResultAsync(response);
            }
            catch (HttpRequestException ex)
            {
                return Result.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result<TData>> PostAsync<TRequest, TData>(string url, TRequest request, bool authorize = true)
        {
            try
            {
                if (authorize)
                {
                    await EnsureAuthorizationAsync();
                }

                return await ReadResultAsync<TData>(await _http.PostAsJsonAsync(url, request));
            }
            catch (HttpRequestException ex)
            {
                return Result<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result<TData>> PatchAsync<TRequest, TData>(string url, TRequest request)
        {
            try
            {
                await EnsureAuthorizationAsync();
                return await ReadResultAsync<TData>(await _http.PatchAsJsonAsync(url, request));
            }
            catch (HttpRequestException ex)
            {
                return Result<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result<TData>> PutAsync<TRequest, TData>(string url, TRequest request)
        {
            try
            {
                await EnsureAuthorizationAsync();
                return await ReadResultAsync<TData>(await _http.PutAsJsonAsync(url, request));
            }
            catch (HttpRequestException ex)
            {
                return Result<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result> DeletePlainAsync(string url)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.DeleteAsync(url);
                return await ReadPlainResultAsync(response);
            }
            catch (HttpRequestException ex)
            {
                return Result.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private async Task<Result<TData>> DeleteAsync<TData>(string url)
        {
            try
            {
                await EnsureAuthorizationAsync();
                var response = await _http.DeleteAsync(url);
                return await ReadResultAsync<TData>(response);
            }
            catch (HttpRequestException ex)
            {
                return Result<TData>.Failure(CreateFetchFailureMessage(ex));
            }
        }

        private static async Task<Result<TData>> ReadResultAsync<TData>(HttpResponseMessage response)
        {
            var body = await response.Content.ReadAsStringAsync();
            if (TryReadJson<Result<TData>>(body, out var result) && result != null)
            {
                return result;
            }

            return Result<TData>.Failure(CreateApiFailureMessage(response, body));
        }

        private static async Task<PagedResult<TData>> ReadPagedResultAsync<TData>(HttpResponseMessage response)
        {
            var body = await response.Content.ReadAsStringAsync();
            if (TryReadJson<PagedResult<TData>>(body, out var result) && result != null)
            {
                return result;
            }

            return PagedResult<TData>.Failure(CreateApiFailureMessage(response, body));
        }

        private static async Task<Result> ReadPlainResultAsync(HttpResponseMessage response)
        {
            var body = await response.Content.ReadAsStringAsync();
            if (TryReadJson<Result>(body, out var result) && result != null)
            {
                return result;
            }

            return Result.Failure(CreateApiFailureMessage(response, body));
        }

        private static bool TryReadJson<T>(string body, out T? result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(body))
            {
                return false;
            }

            try
            {
                result = JsonSerializer.Deserialize<T>(body, JsonOptions);
                return result != null;
            }
            catch (JsonException)
            {
                return false;
            }
        }

        private static string CreateApiFailureMessage(HttpResponseMessage response, string body)
        {
            if ((int)response.StatusCode >= 500)
            {
                return $"API returned {(int)response.StatusCode}: server error. Check the API logs and database connection.";
            }

            var detail = string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase ?? response.StatusCode.ToString() : body.Trim();
            if (detail.Length > 180)
            {
                detail = detail[..180] + "...";
            }

            return $"API returned {(int)response.StatusCode}: {detail}";
        }

        private string CreateFetchFailureMessage(HttpRequestException ex)
            => $"Could not reach the SCMS API at {ApiBaseAddress}. Check that SCMS.Api is running on its HTTPS profile. {ex.Message}";

        private static string Query(params (string Key, string? Value)[] values)
            => string.Join("&", values
                .Where(v => !string.IsNullOrWhiteSpace(v.Value))
                .Select(v => $"{Uri.EscapeDataString(v.Key)}={Uri.EscapeDataString(v.Value!)}"));

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };
    }
}
