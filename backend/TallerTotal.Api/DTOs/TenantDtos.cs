namespace TallerTotal.Api.DTOs;

public record WhatsAppTestRequest(string Phone, string? Message);

public record SetWhatsAppChannelRequest(string Channel);

public record SetVapidKeysRequest(string PublicKey, string PrivateKey);

public record PushTestRequest(Guid MechanicId);
