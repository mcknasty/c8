const config1 = {
  "reporter": [
    "html",
    "text"
  ]
}

const config2 = {
  "lines": 95,
  "branches": "82",
  "statements": "95"
}

const config = { ...config1, ...config2 }

export default config