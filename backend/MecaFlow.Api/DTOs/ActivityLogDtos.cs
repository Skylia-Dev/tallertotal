namespace TallerTotal.Api.DTOs;

public record ActivityLogItemDto(Guid Id, string Username, string Action, string Description, DateTime CreatedAt);

public record ActivityLogPageDto(List<ActivityLogItemDto> Items, int Total, int Page, int PageSize);
