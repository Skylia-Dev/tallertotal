using TallerTotal.Api.Models;

namespace TallerTotal.Api.Services;

/// <summary>Checklist de inspección auto-adjuntado a cada orden nueva, según su tipo.</summary>
public static class ChecklistTemplates
{
    public static readonly Dictionary<ServiceOrderType, string[]> Templates = new()
    {
        [ServiceOrderType.General] =
        [
            "Nivel de aceite", "Líquido refrigerante", "Frenos", "Neumáticos", "Luces",
            "Batería", "Correas", "Filtro de aire", "Limpiaparabrisas", "Suspensión",
            "Escape", "Carrocería", "Fugas visibles",
        ],
        [ServiceOrderType.Lubricentro] =
        [
            "Nivel de aceite motor", "Filtro de aceite", "Filtro de aire", "Filtro de habitáculo",
            "Presión de neumáticos", "Líquido de frenos", "Líquido refrigerante",
            "Estado de correas", "Batería", "Luces", "Escobillas limpiaparabrisas",
        ],
    };

    public static List<ServiceOrderChecklistItem> BuildFor(ServiceOrderType type) =>
        Templates.TryGetValue(type, out var items)
            ? items.Select((desc, i) => new ServiceOrderChecklistItem { Description = desc, Position = i }).ToList()
            : [];
}
