job "durn" {
  type = "service"

  group "durn" {
    network {
      port "http" { }
    }

    service {
      name     = "durn"
      port     = "http"
      provider = "nomad"
      tags = [
        "traefik.enable=true",
        "traefik.http.routers.durn.rule=Host(`durn.datasektionen.se`)",
        "traefik.http.routers.durn.tls.certresolver=default",
      ]
    }

    task "durn" {
      driver = "docker"

      config {
        image = var.image_tag
        ports = ["http"]
      }

      template {
        data        = <<ENV
{{ with nomadVar "nomad/jobs/durn" }}
DATABASE_URL=postgresql://durn:{{ .db_password }}@postgres.dsekt.internal:5432/durn
LOGIN_KEY={{ .login_key }}
{{ end }}
PORT={{ env "NOMAD_PORT_http" }}
HOST=0.0.0.0
LOGIN_URL=https://sso.datasektionen.se/legacyapi
PLS_URL=https://pls.datasektionen.se
ENV
        destination = "local/.env"
        env         = true
      }

      resources {
        memory = 120
      }
    }
  }
}

variable "image_tag" {
  type = string
  default = "ghcr.io/datasektionen/durn-the-third:latest"
}
