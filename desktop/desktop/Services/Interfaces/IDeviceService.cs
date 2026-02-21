using System.Collections.Generic;
using System.Threading.Tasks;

public record DeviceInfo(string Id, string Name);

public interface IDeviceService
{
    Task<IList<DeviceInfo>> GetDevicesAsync();
    Task StartCaptureAsync(string deviceId, string mode = "video");
    Task StopCaptureAsync(string deviceId);
}
