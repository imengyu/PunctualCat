{
  "targets": [
    {
      "target_name": "bells",
      "sources": [ "win32.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}