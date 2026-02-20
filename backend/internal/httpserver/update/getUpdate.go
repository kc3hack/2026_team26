package update

import (
	"encoding/json"
	"net/http"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/model/response"
)

func MakeCheckUpdateHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		version := "0.0.0"
		res := response.Update{Current: version, Support: []string{"0.0.0", "0.0.1"}}
		w.Header().Set("Content-Type", common.ContentTypeJSON)
		_ = json.NewEncoder(w).Encode(res)
	}
}
