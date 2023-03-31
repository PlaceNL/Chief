resource "random_password" "placenl-db-user-password" {
  length  = 32
  special = false
}
resource "random_password" "placenl-db-user-username" {
  length  = 32
  special = false
}
resource "kubernetes_persistent_volume_claim" "placenl-db-pvc" {
  metadata {
    name      = "placenl-db-pvc"
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


resource "kubernetes_deployment" "placenl-db-deploy" {
  metadata {
    name      = "placenl-db"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
    labels = {
      db = "placenl"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        db = "placenl"
      }
    }

    template {
      metadata {
        labels = {
          db = "placenl"
        }
      }
      spec {
        container {
          image             = "postgres:latest"
          name              = "placenl-db"
          image_pull_policy = "Always"
          volume_mount {
            mount_path = "/var/lib/postgresql/"
            name       = "placenl-db-pv"
          }

          env {
            name  = "POSTGRES_DB"
            value = "postgres"
          }
          env {
            name  = "POSTGRES_PASSWORD"
            value = random_password.placenl-db-user-password.result
          }
          env {
            name  = "POSTGRES_USER"
            value = random_password.placenl-db-user-username.result
          }
        }
        volume {
          name = "placenl-db-pv"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.placenl-db-pvc.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "placenl-db-service" {
  metadata {
    name      = "placenl-db-service"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
  }
  spec {
    selector = {
      db = "placenl"
    }
    port {
      target_port = "5432"
      port        = "5432"
    }
  }
}