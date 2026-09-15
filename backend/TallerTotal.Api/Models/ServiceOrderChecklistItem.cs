namespace TallerTotal.Api.Models;

/// <summary>
/// One inspection item on a ServiceOrder's checklist (auto-attached from ChecklistTemplates
/// at creation, based on the order's Type). Checked is tri-state: null = sin revisar.
/// </summary>
public class ServiceOrderChecklistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ServiceOrderId { get; set; }
    public string Description { get; set; } = "";
    public bool? Checked { get; set; }
    public int Position { get; set; }

    public ServiceOrder ServiceOrder { get; set; } = null!;
}
