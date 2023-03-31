resource "random_password" "grafana-password" {
  length  = 32
  special = false
}
resource "random_password" "grafana-username" {
  length  = 32
  special = false
}

resource "kubernetes_deployment" "grafana" {
  metadata {
    name = "grafana"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
    labels = {
      app = "grafana"
    }
  }

  spec {
    selector {
      match_labels = {
        app = "grafana"
      }
    }

    template {
      metadata {
        labels = {
          app = "grafana"
        }
      }

      spec {
        container {
          image = "grafana/grafana:latest"
          name  = "grafana"

          env {
            name  = "GF_SERVER_ROOT_URL"
            value = "http://localhost:3000"
          }
          env {
            name  = "GF_SECURITY_ADMIN_USER"
            value = random_password.grafana-password.result
          }

          env {
            name  = "GF_SECURITY_ADMIN_PASSWORD"
            value = random_password.grafana-password.result
          }


          ports {
            container_port = 3000
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "grafana" {
  metadata {
    name = "grafana"
  }

  spec {
    selector = {
      app = "grafana"
    }

    port {
      port = 80
      target_port = 3000
    }

    type = "LoadBalancer"
  }
}
resource "kubectl_manifest" "grafana-ingress" {
  yaml_body = file("./ingress-grafana.yml")
}

