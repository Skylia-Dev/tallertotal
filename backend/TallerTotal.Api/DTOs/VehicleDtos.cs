using System.ComponentModel.DataAnnotations;

namespace TallerTotal.Api.DTOs;

public record CreateVehicleDto(
    [Required] Guid CustomerId,
    [Required, MaxLength(20)] string LicensePlate,
    [Required, MaxLength(60)] string Brand,
    [Required, MaxLength(60)] string Model,
    [Range(1900, 2100)] int Year,
    [MaxLength(40)] string? Color,
    string? Notes
);

public record VehicleDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string CustomerPhone,
    string LicensePlate,
    string Brand,
    string Model,
    int Year,
    string? Color,
    string? Notes,
    Guid PortalToken
);

// Libreta Digital — historial público del vehículo, sin datos internos/sensibles
public record LibretaEntryDto(
    DateTime Date,
    int? MileageIn,
    string? OilBrand,
    string? OilType,
    decimal? OilLiters,
    bool ChangedOilFilter,
    bool ChangedAirFilter,
    bool ChangedCabinFilter,
    bool ChangedFuelFilter,
    string? Notes
);

public record LibretaDto(
    string TallerName,
    string? TallerPhone,
    string LicensePlate,
    string VehicleDescription,
    string CustomerName,
    DateOnly? NextServiceDate,
    int? NextServiceKm,
    int? KmRemaining,
    int? DaysRemaining,
    string? DueStatus,
    List<LibretaEntryDto> Services
);
