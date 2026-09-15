namespace TallerTotal.Api.Models;

/// <summary>
/// Issued right after a password check succeeds for a user with 2FA enabled.
/// The client must exchange it for a real JWT by submitting a valid TOTP code
/// before it expires. Single-use.
/// </summary>
public class LoginTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
