package fatigue

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/service"
	"github.com/team26/backend/internal/utils"
)

func MakeListFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		uid := q.Get("u")
		f := q.Get("f")
		t := q.Get("t")
		nstr := q.Get("n")

		if uid == "" {
			common.WriteErrorJSON(w, http.StatusBadRequest, "u required")
			return
		}

		maxNum, err := utils.SetNum(nstr, 60*24)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid n: must be integer")
			return
		}
		if maxNum < 1 {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid n: must be >= 1")
			return
		}

		fromT, err := utils.StrToTime(f, time.Unix(0, 0).UTC())
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid f: must be RFC3339 as string")
			return
		}

		toT, err := utils.StrToTime(t, time.Now().UTC())
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid t: must be RFC3339 as string")
			return
		}

		list, err := svc.List(uid, fromT, toT, maxNum)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusInternalServerError, "failed")
			return
		}

		w.Header().Set("Content-Type", common.ContentTypeJSON)
		json.NewEncoder(w).Encode(list)
	}
}
