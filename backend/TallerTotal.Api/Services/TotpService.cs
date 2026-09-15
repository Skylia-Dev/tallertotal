using OtpNet;

namespace TallerTotal.Api.Services;

public static class TotpService
{
    public static string GenerateSecret() => Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20));

    public static string BuildOtpAuthUri(string secret, string username) =>
        $"otpauth://totp/TallerTotal:{Uri.EscapeDataString(username)}?secret={secret}&issuer=TallerTotal&digits=6&period=30";

    /// <summary>±1 step (30s) window to tolerate clock drift between server and the authenticator app.</summary>
    public static bool VerifyCode(string secret, string code) =>
        new Totp(Base32Encoding.ToBytes(secret)).VerifyTotp(code, out _, new VerificationWindow(1, 1));
}
