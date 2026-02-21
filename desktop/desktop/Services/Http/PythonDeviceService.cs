using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

public class PythonDeviceService : IDeviceService
{
    private readonly HttpClient _http;

    public PythonDeviceService(HttpClient httpClient)
    {
        _http = httpClient;
    }

    public async Task<IList<DeviceInfo>> GetDevicesAsync()
    {
        var res = await _http.GetAsync("/api/devices");
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadAsStringAsync();
        var list = new List<DeviceInfo>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            foreach (var el in doc.RootElement.EnumerateArray())
            {
                var id = el.GetProperty("id").GetString();
                var name = el.GetProperty("name").GetString();
                list.Add(new DeviceInfo(id ?? "", name ?? ""));
            }
        }
        catch
        {
            // fallback to typed read
            var typed = await res.Content.ReadFromJsonAsync<List<DeviceInfo>>();
            if (typed != null) list = typed;
        }
        return list ?? new List<DeviceInfo>();
    }

    public async Task StartCaptureAsync(string deviceId, string mode = "video")
    {
        var body = new { device_id = deviceId, mode = mode };
        var res = await _http.PostAsJsonAsync("/api/start_capture", body);
        res.EnsureSuccessStatusCode();
    }

    public async Task StopCaptureAsync(string deviceId)
    {
        var body = new { device_id = deviceId };
        var res = await _http.PostAsJsonAsync("/api/stop_capture", body);
        res.EnsureSuccessStatusCode();
    }
}
