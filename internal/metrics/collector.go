package metrics

import (
	"os"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/load"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

// SystemMetrics holds all system monitoring data
type SystemMetrics struct {
	Timestamp   int64          `json:"timestamp"`
	Hostname    string         `json:"hostname"`
	CPU         CPUMetrics     `json:"cpu"`
	Memory      MemoryMetrics  `json:"memory"`
	Disk        DiskMetrics    `json:"disk"`
	Network     NetworkMetrics `json:"network"`
	LoadAverage LoadAvgMetrics `json:"loadAverage"`
	Uptime      int64          `json:"uptime"`
}

type CPUMetrics struct {
	Total   float64   `json:"total"`
	PerCore []float64 `json:"perCore"`
}

type MemoryMetrics struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Available   uint64  `json:"available"`
	UsedPercent float64 `json:"usedPercent"`
}

type DiskMetrics struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

type NetworkMetrics struct {
	BytesRecv uint64  `json:"bytesRecv"`
	BytesSent uint64  `json:"bytesSent"`
	RxRate    float64 `json:"rxRate"`
	TxRate    float64 `json:"txRate"`
	IsSpike   bool    `json:"isSpike"`
}

type LoadAvgMetrics struct {
	Load1  float64 `json:"load1"`
	Load5  float64 `json:"load5"`
	Load15 float64 `json:"load15"`
}

// Collector manages system metrics collection
type Collector struct {
	lastNetStats net.IOCountersStat
	lastTime     time.Time
}

// NewCollector creates a new metrics collector
func NewCollector() *Collector {
	return &Collector{
		lastTime: time.Now(),
	}
}

// Collect gathers all system metrics
func (c *Collector) Collect() (*SystemMetrics, error) {
	metrics := &SystemMetrics{
		Timestamp: time.Now().Unix(),
	}

	// Hostname
	hostname, err := os.Hostname()
	if err == nil {
		metrics.Hostname = hostname
	} else {
		metrics.Hostname = "Unknown"
	}

	// CPU metrics
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		metrics.CPU.Total = cpuPercent[0]
	}

	cpuPerCore, err := cpu.Percent(0, true)
	if err == nil {
		metrics.CPU.PerCore = cpuPerCore
	}

	// Memory metrics
	vmem, err := mem.VirtualMemory()
	if err == nil {
		metrics.Memory = MemoryMetrics{
			Total:       vmem.Total,
			Used:        vmem.Used,
			Available:   vmem.Available,
			UsedPercent: vmem.UsedPercent,
		}
	}

	// Disk metrics
	diskUsage, err := disk.Usage("/")
	if err == nil {
		metrics.Disk = DiskMetrics{
			Total:       diskUsage.Total,
			Used:        diskUsage.Used,
			Free:        diskUsage.Free,
			UsedPercent: diskUsage.UsedPercent,
		}
	}

	// Network metrics
	netIO, err := net.IOCounters(false)
	if err == nil && len(netIO) > 0 {
		now := time.Now()
		timeDiff := now.Sub(c.lastTime).Seconds()

		if timeDiff > 0 && c.lastTime.Unix() > 0 {
			bytesDiff := netIO[0].BytesRecv - c.lastNetStats.BytesRecv
			sentDiff := netIO[0].BytesSent - c.lastNetStats.BytesSent
			rxRate := float64(bytesDiff) / timeDiff
			txRate := float64(sentDiff) / timeDiff

			// Spike threshold: 10 MB/s
			const spikeThreshold = 10 * 1024 * 1024
			isSpike := rxRate > spikeThreshold || txRate > spikeThreshold

			metrics.Network = NetworkMetrics{
				BytesRecv: netIO[0].BytesRecv,
				BytesSent: netIO[0].BytesSent,
				RxRate:    rxRate,
				TxRate:    txRate,
				IsSpike:   isSpike,
			}
		} else {
			metrics.Network = NetworkMetrics{
				BytesRecv: netIO[0].BytesRecv,
				BytesSent: netIO[0].BytesSent,
			}
		}

		c.lastNetStats = netIO[0]
		c.lastTime = now
	}

	// Load average
	loadAvg, err := load.Avg()
	if err == nil {
		metrics.LoadAverage = LoadAvgMetrics{
			Load1:  loadAvg.Load1,
			Load5:  loadAvg.Load5,
			Load15: loadAvg.Load15,
		}
	}

	// Uptime
	uptime, err := host.Uptime()
	if err == nil {
		metrics.Uptime = int64(uptime)
	}

	return metrics, nil
}
