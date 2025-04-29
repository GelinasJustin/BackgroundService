using System.ComponentModel.DataAnnotations;

namespace BackgroundService.DTOs
{
    public class GameInfoDTO
    {
        // TODO: Include l'information à propos du nombre de victoire ET le coût d'un multiplie
        public int NbWins { get; set; }
        public int MultiplierCost { get; set; }
    }
}
