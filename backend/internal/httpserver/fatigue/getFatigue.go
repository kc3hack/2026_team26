package fatigue

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/team26/backend/internal/httpserver/common"
	"github.com/team26/backend/internal/service"
)

func strToTime(stringTime string, defaultTime time.Time) (time.Time, error) {
	if stringTime == "" {
		return defaultTime, nil
	}
	res, err := time.Parse(time.RFC3339, stringTime)
	return res, err
}

func setNum(nstr string, defaultInt int) (int, error) {
	if nstr == "" {
		return defaultInt, nil
	}
	res, err := strconv.Atoi(nstr)
	return res, err
}

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

		maxNum, err := setNum(nstr, 60*24)
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid n: must be integer")
			return
		}
		if maxNum < 1 {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid n: must be >= 1")
			return
		}

		fromT, err := strToTime(f, time.Unix(0, 0).UTC())
		if err != nil {
			common.WriteErrorJSON(w, http.StatusBadRequest, "invalid f: must be RFC3339 as string")
			return
		}

		toT, err := strToTime(t, time.Now().UTC())
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
