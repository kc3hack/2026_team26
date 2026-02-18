package httpserver

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/team26/backend/internal/service"
)

func makeListFatigueHandler(svc *service.FatigueService) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        q := r.URL.Query()
        uid := q.Get("u")
        f := q.Get("f")
        t := q.Get("t")
				nstr := q.Get("n")
        // parse optional limit 'n'
        maxNum := 60 * 24 // 1日分
        var fromT time.Time
        var toT time.Time
        if uid == "" {
            writeErrorJSON(w, http.StatusBadRequest, "u required")
            return
        }

        if nstr != "" {
            var err error
            maxNum, err = strconv.Atoi(nstr)
            if err != nil {
                writeErrorJSON(w, http.StatusBadRequest, "invalid n: must be integer")
                return
            }
        }

				if f != "" && t != "" && nstr != "" {
					writeErrorJSON(w, http.StatusBadRequest, "It is not permitted to list all of n, f, and t")
					return
				}

        if f == "" {
          // default from = Unix epoch (1970-01-01T00:00:00Z)
          fromT = time.Unix(0, 0).UTC()
        } else {
          var err error
          fromT, err = time.Parse(time.RFC3339, f)
          if err != nil {
            writeErrorJSON(w, http.StatusBadRequest, "invalid param f")
            return
          }
        }

        if t == "" {
          toT = time.Now().UTC()
        } else {
          var err error
          toT, err = time.Parse(time.RFC3339, t)
          if err != nil {
            writeErrorJSON(w, http.StatusBadRequest, "invalid param t")
            return
          }
        }

        list, err := svc.List(uid, fromT, toT, maxNum)
        if err != nil {
            writeErrorJSON(w, http.StatusInternalServerError, "failed")
            return
        }
        // apply limit if requested
        if nstr != "" && maxNum > 0 && len(list) > maxNum {
          list = list[:maxNum]
        }
        w.Header().Set("Content-Type", contentTypeJSON)
        json.NewEncoder(w).Encode(list)
    }
}
