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
    }
}
