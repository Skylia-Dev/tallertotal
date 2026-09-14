namespace TallerTotal.Api.DTOs;

public record TenantModuleConfigDto(List<string> HiddenModules);

public record UpdateTenantModuleConfigDto(List<string> HiddenModules);
