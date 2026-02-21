using System.Text.Json.Serialization;

namespace FatigueSystem
{
    public class FatigueData
    {
        [JsonPropertyName("score")]
        public double Score { get; set; }

        [JsonPropertyName("image_data")]
        public string ImageData { get; set; }
    }
}