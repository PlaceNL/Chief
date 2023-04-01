resource "kubernetes_persistent_volume_claim" "placenl-prometheus-pvc" {
  metadata {
    name      = "placenl-prometheus-pvc"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
  }
  spec {
    access_modes       = ["ReadWriteMany"]
    storage_class_name = "longhorn-2"
    resources {
      requests = {
        storage = "10Gi"
      }
    }

  }
}

resource "kubectl_manifest" "prometheus-configmap" {
  yaml_body = file("./configmap-prometheus.yml")
}


resource "kubernetes_deployment" "prometheus" {
  metadata {
    name = "prometheus"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
    labels = {
      app = "prometheus"
    }
  }

  spec {
    selector {
      match_labels = {
        app = "prometheus"
      }
    }

    template {
      metadata {
        labels = {
          app = "prometheus"
        }
      }

      spec {
        container {
          image = "prom/prometheus:latest"
          name  = "prometheus"


        volume_mount {
          name = "prometheus-config-volume"
          mount_path = "/etc/prometheus/"
        }
        volume_mount {
             name = "prometheus-storage-volume"
             mount_path= "/prometheus/"
        }
        port {
          container_port = 9090
        }
        }
        volume {
          name = "prometheus-config-volume"
          config_map {
            name = "prometheus-server-conf"
          }
        }
        volume {
          name = "prometheus-storage-volume"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.placenl-prometheus-pvc.metadata[0].name
          }
        }
      }
    }
  }
}
resource "kubernetes_service" "prometheus" {
  metadata {
    name = "prometheus"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
  }

  spec {
    selector = {
      app = "prometheus"
    }

    port {
      port = 9090
      target_port = 9090
    }
  }
}