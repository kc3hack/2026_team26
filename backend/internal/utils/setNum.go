package utils

import "strconv"

func SetNum(nstr string, defaultInt int) (int, error) {
	if nstr == "" {
		return defaultInt, nil
	}
	res, err := strconv.Atoi(nstr)
	return res, err
}
