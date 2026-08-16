using SCMS.Domain.Common;
using Xunit;

namespace SCMS.Domain.Tests.Common;

public class ValidationHelperTests
{
    [Theory]
    [InlineData("09771234567", true, "09771234567")]
    [InlineData("+959771234567", true, "09771234567")]
    [InlineData("959771234567", true, "09771234567")]
    [InlineData("09 771 234 567", true, "09771234567")]
    [InlineData("09-771-234-567", true, "09771234567")]
    [InlineData("09420012345", true, "09420012345")]
    [InlineData("12345678", false, "")]
    [InlineData("abcdefghij", false, "")]
    [InlineData("", false, "")]
    [InlineData(null, false, "")]
    public void IsValidMyanmarMobile_NormalizesAndValidatesCorrectly(string? input, bool expectedValid, string expectedNormalized)
    {
        var isValid = ValidationHelper.IsValidMyanmarMobile(input, out var normalized);

        Assert.Equal(expectedValid, isValid);
        if (expectedValid)
        {
            Assert.Equal(expectedNormalized, normalized);
        }
    }

    [Theory]
    [InlineData("user@example.com", true, "user@example.com")]
    [InlineData("  Admin@SCMS.Demo  ", true, "admin@scms.demo")]
    [InlineData("doctor.thandar+scms@clinic.co.mm", true, "doctor.thandar+scms@clinic.co.mm")]
    [InlineData("invalid-email", false, "")]
    [InlineData("@missinguser.com", false, "")]
    [InlineData("user@", false, "")]
    [InlineData("", false, "")]
    [InlineData(null, false, "")]
    public void IsValidEmail_NormalizesAndValidatesCorrectly(string? input, bool expectedValid, string expectedNormalized)
    {
        var isValid = ValidationHelper.IsValidEmail(input, out var normalized);

        Assert.Equal(expectedValid, isValid);
        if (expectedValid)
        {
            Assert.Equal(expectedNormalized, normalized);
        }
    }
}
