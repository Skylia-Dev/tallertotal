using TallerTotal.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateServiceItemDto(
    [MaxLength(200)] string? Description,
    ServiceItemType Type,
    [Range(0.01, double.MaxValue)] decimal Quantity,
    [Range(0, double.MaxValue)] decimal UnitPrice
);

public record ServiceItemDto(
    Guid Id,
    string Description,
    ServiceItemType Type,
    decimal Quantity,
    decimal UnitPrice,
    decimal Total
);

// Solo se usan cuando Type == Lubricentro — el resto de los campos quedan en null/false.
public record LubricentroDetailsDto(
    string? OilBrand,
    string? OilType,
    decimal? OilLiters,
    bool ChangedOilFilter,
    bool ChangedAirFilter,
    bool ChangedCabinFilter,
    bool ChangedFuelFilter,
    int? NextServiceKm,
    DateOnly? NextServiceDate
);

public record ChecklistItemDto(Guid Id, string Description, bool? Checked, int Position);
public record ChecklistAnswerDto(string Description, bool? Checked);
public record UpdateChecklistItemDto(Guid Id, bool? Checked);
public record UpdateChecklistDto(List<UpdateChecklistItemDto> Items);

public record CreateServiceOrderDto(
    [Required] Guid VehicleId,
    ServiceOrderType Type,
    string? DiagnosisNotes,
    int? MileageIn,
    [MaxLength(100)] string? AssignedMechanic,
    [MaxLength(1000)] string? InternalNotes,
    DateOnly? EstimatedDeliveryAt,
    List<CreateServiceItemDto> Items,
    LubricentroDetailsDto? Lubricentro = null,
    // Respuestas del checklist completadas ya en el alta; lo no incluido queda "sin revisar".
    List<ChecklistAnswerDto>? ChecklistAnswers = null
);

public record UpdateServiceOrderDto(
    ServiceOrderStatus Status,
    string? DiagnosisNotes,
    int? MileageIn,
    string? AssignedMechanic,
    [MaxLength(1000)] string? InternalNotes,
    DateOnly? EstimatedDeliveryAt,
    decimal TotalEstimate,
    decimal TotalFinal,
    List<CreateServiceItemDto> Items,
    LubricentroDetailsDto? Lubricentro = null
);

public record ServiceOrderDto(
    Guid Id,
    Guid VehicleId,
    string LicensePlate,
    string VehicleDescription,
    string CustomerName,
    string CustomerPhone,
    ServiceOrderType Type,
    ServiceOrderStatus Status,
    string? DiagnosisNotes,
    int? MileageIn,
    string? AssignedMechanic,
    string? InternalNotes,
    DateOnly? EstimatedDeliveryAt,
    decimal TotalEstimate,
    decimal TotalFinal,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    List<ServiceItemDto> Items,
    QuoteStatus QuoteStatus,
    DateTime LastActivityAt,
    Guid PortalToken,
    string? MpPaymentLinkUrl,
    LubricentroDetailsDto? Lubricentro,
    List<ChecklistItemDto> Checklist
);

public record UpcomingLubricentroDto(
    Guid VehicleId,
    string LicensePlate,
    string VehicleDescription,
    string CustomerName,
    string CustomerPhone,
    Guid LastServiceOrderId,
    DateTime LastServiceDate,
    DateOnly? NextServiceDate,
    int? NextServiceKm,
    int? LastKnownMileage,
    int? KmRemaining,
    int? DaysRemaining,
    string DueStatus
);

// Public portal DTO — no sensitive internal data
public record PortalOrderDto(
    Guid Id,
    string LicensePlate,
    string VehicleDescription,
    string CustomerName,
    ServiceOrderStatus Status,
    QuoteStatus QuoteStatus,
    string? DiagnosisNotes,
    DateOnly? EstimatedDeliveryAt,
    decimal TotalEstimate,
    decimal TotalFinal,
    DateTime CreatedAt,
    DateTime? CompletedAt,
    List<ServiceItemDto> Items
);

public record ServiceOrderLogDto(
    Guid Id,
    string Event,
    string? OldValue,
    string? NewValue,
    string ChangedBy,
    DateTime ChangedAt
);

public record DashboardMetricsDto(
    decimal RevenueThisMonth,
    decimal RevenueLastMonth,
    int OrdersThisMonth,
    int OrdersLastMonth,
    IEnumerable<StatusCountDto> OrdersByStatus,
    TopMechanicDto? TopMechanic,
    IEnumerable<MonthlyStatDto> MonthlyStats,
    IEnumerable<MechanicStatDto> MechanicStats,
    decimal AvgTicket,
    int OverdueCount,
    decimal CompletionRate
);

public record StatusCountDto(string Status, int Count, decimal Revenue);
public record TopMechanicDto(string Name, int OrderCount);
public record MonthlyStatDto(string Month, decimal Revenue, int Orders);
public record MechanicStatDto(string Name, int Orders, decimal Revenue);
