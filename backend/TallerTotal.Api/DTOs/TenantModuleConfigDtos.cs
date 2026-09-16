namespace TallerTotal.Api.DTOs;

public record RoleModuleConfigDto(List<string> HiddenModules);

public record UpdateRoleModuleConfigDto(List<string> HiddenModules);
