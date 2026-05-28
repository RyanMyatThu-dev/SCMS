using System.Text;

using SCMS.Shared.Contracts.Payments;
using SCMS.Shared.Contracts.Prescriptions;

namespace SCMS.Domain.Features.Documents
{
    public class PdfDocumentService
    {
        public byte[] CreateMedicalSummaryPdf(string title, string html)
        {
            var plainText = StripHtml(html);
            return CreateSimplePdf(title, plainText);
        }

        public byte[] CreatePrescriptionPdf(PrescriptionResponse prescription)
        {
            var lines = new List<string>
            {
                $"Prescription #{prescription.Id}",
                $"Patient: {prescription.PatientName}",
                $"Appointment: {prescription.AppointmentCode}",
                $"Disease: {prescription.DiseaseName ?? "General Consultation"}",
                $"Vitals: BP {prescription.BloodPressureSystolic}/{prescription.BloodPressureDiastolic}, Weight {prescription.WeightKg}kg, BMI {prescription.Bmi}",
                $"Notes: {prescription.Notes ?? "-"}",
                "Medicines:"
            };
            lines.AddRange(prescription.Items.Select(i => $"- {i.MedicineName} {i.Dosage} Qty {i.Quantity} for {i.Days} day(s). {i.Instruction}"));
            if (!string.IsNullOrWhiteSpace(prescription.LabTestRequests))
            {
                lines.Add($"Lab requests: {prescription.LabTestRequests}");
            }

            return CreateSimplePdf($"Prescription {prescription.Id}", string.Join(Environment.NewLine, lines));
        }

        public byte[] CreateInvoicePdf(PaymentDetailsResponse payment)
        {
            var total = payment.Amount + payment.Tax + payment.Charges;
            var text = $"""
            Invoice #{payment.Id}
            Appointment: {payment.AppointmentCode}
            Patient: {payment.PatientName}
            Method: {payment.PaymentMethod}
            Status: {payment.PaymentStatus}
            Amount: {payment.Amount:N2}
            Tax: {payment.Tax:N2}
            Charges: {payment.Charges:N2}
            Total: {total:N2}
            Paid at: {payment.PaidAt?.ToString("yyyy-MM-dd HH:mm") ?? "-"}
            """;
            return CreateSimplePdf($"Invoice {payment.Id}", text);
        }



        private static byte[] CreateSimplePdf(string title, string text)
        {
            var lines = WrapLines($"{title}\n\n{text}", 88).Take(48).ToList();
            var content = new StringBuilder("BT /F1 11 Tf 50 780 Td 14 TL ");
            foreach (var line in lines)
            {
                content.Append('(').Append(EscapePdfText(line)).Append(") Tj T* ");
            }
            content.Append("ET");

            var stream = Encoding.ASCII.GetBytes(content.ToString());
            var objects = new List<string>
            {
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
                $"<< /Length {stream.Length} >>\nstream\n{content}\nendstream"
            };

            var output = new StringBuilder("%PDF-1.4\n");
            var offsets = new List<int> { 0 };
            foreach (var (obj, index) in objects.Select((obj, index) => (obj, index)))
            {
                offsets.Add(Encoding.ASCII.GetByteCount(output.ToString()));
                output.Append(index + 1).Append(" 0 obj\n").Append(obj).Append("\nendobj\n");
            }

            var xrefOffset = Encoding.ASCII.GetByteCount(output.ToString());
            output.Append("xref\n0 ").Append(objects.Count + 1).Append("\n");
            output.Append("0000000000 65535 f \n");
            foreach (var offset in offsets.Skip(1))
            {
                output.Append(offset.ToString("D10")).Append(" 00000 n \n");
            }
            output.Append("trailer << /Size ").Append(objects.Count + 1).Append(" /Root 1 0 R >>\n");
            output.Append("startxref\n").Append(xrefOffset).Append("\n%%EOF");
            return Encoding.ASCII.GetBytes(output.ToString());
        }

        private static IEnumerable<string> WrapLines(string text, int width)
        {
            foreach (var sourceLine in text.Replace("\r", string.Empty).Split('\n'))
            {
                var line = sourceLine.Trim();
                while (line.Length > width)
                {
                    yield return line[..width];
                    line = line[width..].TrimStart();
                }
                yield return line;
            }
        }

        private static string StripHtml(string html)
        {
            var builder = new StringBuilder();
            var insideTag = false;
            foreach (var c in html)
            {
                if (c == '<')
                {
                    insideTag = true;
                    builder.Append(' ');
                    continue;
                }
                if (c == '>')
                {
                    insideTag = false;
                    continue;
                }
                if (!insideTag)
                {
                    builder.Append(c);
                }
            }
            return System.Net.WebUtility.HtmlDecode(builder.ToString());
        }

        private static string EscapePdfText(string text)
            => text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
    }
}
