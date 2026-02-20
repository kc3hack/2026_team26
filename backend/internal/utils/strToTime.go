package utils

import "time"

func StrToTime(stringTime string, defaultTime time.Time) (time.Time, error) {
	if stringTime == "" {
		return defaultTime, nil
	}
	res, err := time.Parse(time.RFC3339, stringTime)
	return res, err
}
