package ws

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct{
    mu sync.Mutex
    conns map[*websocket.Conn]bool
}

func NewHub() *Hub {
    return &Hub{conns: make(map[*websocket.Conn]bool)}
}


var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
    c, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        http.Error(w, "upgrade failed", http.StatusInternalServerError)
        return
    }
    h.mu.Lock()
    h.conns[c] = true
    h.mu.Unlock()

    // read loop to keep connection open
    for {
        _, _, err := c.ReadMessage()
        if err != nil {
            break
        }
    }
    h.mu.Lock()
    delete(h.conns, c)
    h.mu.Unlock()
    c.Close()
}

func (h *Hub) BroadcastAny(v interface{}) {
    b, _ := json.Marshal(v)
    h.mu.Lock()
    defer h.mu.Unlock()
    for c := range h.conns {
        _ = c.WriteMessage(websocket.TextMessage, b)
    }
}
