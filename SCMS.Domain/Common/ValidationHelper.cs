using System;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace SCMS.Domain.Common
{
    public static class ValidationHelper
    {
        // Myanmar mobile regex: matches +959..., 09..., 959..., +95 9... followed by 7 to 9 digits
        private static readonly Regex MyanmarMobileRegex = new(
            @"^(?:\+?95\s?9|\+?9509|09|959)(\d{7,9})$",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public static bool IsValidMyanmarMobile(string? mobileNo, out string normalizedMobile)
        {
            normalizedMobile = string.Empty;
            if (string.IsNullOrWhiteSpace(mobileNo))
            {
                return false;
            }

            var clean = mobileNo.Trim().Replace(" ", "").Replace("-", "");
            var match = MyanmarMobileRegex.Match(clean);
            if (match.Success)
            {
                normalizedMobile = "09" + match.Groups[1].Value;
                return true;
            }

            return false;
        }

        public static bool IsValidEmail(string? email, out string normalizedEmail)
        {
            normalizedEmail = string.Empty;
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            var trimmed = email.Trim().ToLowerInvariant();
            if (MailAddress.TryCreate(trimmed, out var address) && address.Address == trimmed && trimmed.Contains('.'))
            {
                normalizedEmail = trimmed;
                return true;
            }

            return false;
        }

        private static readonly Regex HtmlTagRegex = new(@"<[^>]*>|&#?\w+;", RegexOptions.Compiled | RegexOptions.CultureInvariant);

        public static string? SanitizeText(string? input, int maxLength = 500)
        {
            if (string.IsNullOrWhiteSpace(input)) return null;

            // Strip HTML/Script tags and special control characters
            var cleaned = HtmlTagRegex.Replace(input, string.Empty);
            cleaned = Regex.Replace(cleaned, @"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", string.Empty);
            cleaned = cleaned.Trim();

            if (string.IsNullOrWhiteSpace(cleaned)) return null;

            return cleaned.Length > maxLength ? cleaned[..maxLength].Trim() : cleaned;
        }

        public static string NormalizeBloodType(string? bloodType)
        {
            if (string.IsNullOrWhiteSpace(bloodType)) return "O+";

            var clean = bloodType.Trim().ToUpperInvariant();
            return clean switch
            {
                "A+" or "A POSITIVE" => "A+",
                "A-" or "A NEGATIVE" => "A-",
                "B+" or "B POSITIVE" => "B+",
                "B-" or "B NEGATIVE" => "B-",
                "AB+" or "AB POSITIVE" => "AB+",
                "AB-" or "AB NEGATIVE" => "AB-",
                "O+" or "O POSITIVE" => "O+",
                "O-" or "O NEGATIVE" => "O-",
                _ => "O+"
            };
        }

        public static string NormalizeGender(string? gender)
        {
            if (string.IsNullOrWhiteSpace(gender)) return "Male";

            var clean = gender.Trim().ToLowerInvariant();
            return clean switch
            {
                "female" or "f" => "Female",
                "other" => "Other",
                _ => "Male"
            };
        }

        public static bool ValidateDateOfBirth(DateOnly? dob, out string? errorMessage)
        {
            errorMessage = null;
            if (!dob.HasValue) return true;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (dob.Value > today)
            {
                errorMessage = "Date of birth cannot be in the future.";
                return false;
            }

            if (dob.Value < new DateOnly(1900, 1, 1))
            {
                errorMessage = "Date of birth must be on or after year 1900.";
                return false;
            }

            return true;
        }
    }
}
