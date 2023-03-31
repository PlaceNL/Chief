terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "2.27.1"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.7.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.19.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

data "digitalocean_kubernetes_cluster" "doks" {
  name = "nl01"
}

provider "kubernetes" {
  host  = data.digitalocean_kubernetes_cluster.doks.endpoint
  token = data.digitalocean_kubernetes_cluster.doks.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.doks.kube_config[0].cluster_ca_certificate
  )
}

resource "kubernetes_namespace" "placenl-namespace" {
  metadata {
    name = "placenl"
  }
}


resource "kubernetes_persistent_volume_claim" "placenl-image-pvc" {
  metadata {
    name      = "placenl-image-pvc"
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


resource "kubernetes_deployment" "placenl-app-deploy" {
  depends_on = [
    kubernetes_deployment.placenl-db-deploy
  ]
  metadata {
    name      = "placenl-app"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
    labels = {
      app = "placenl"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "placenl"
      }
    }

    template {
      metadata {
        labels = {
          app = "placenl"
        }
      }
      spec {
        container {
          image             = var.placenl_image
          name              = "placenl-app"
          image_pull_policy = "Always"
          volume_mount {
            mount_path = var.IMAGES_DIRECTORY
            name       = "placenl-image-pv"
          }

          env {
            name  = "BASE_URL"
            value = var.BASE_URL
          }
          env {
            name  = "DISCORD_CLIENT_ID"
            value = var.DISCORD_CLIENT_ID
          }
          env {
            name  = "DISCORD_CLIENT_SECRET"
            value = var.DISCORD_CLIENT_SECRET
          }
          env {
            name  = "DISCORD_SERVER_ID"
            value = var.DISCORD_SERVER_ID
          }
          env {
            name  = "DISCORD_ROLE_ID"
            value = var.DISCORD_ROLE_ID
          }
          env {
            name  = "IMAGES_DIRECTORY"
            value = var.IMAGES_DIRECTORY
          }
          env {
            name  = "POSTGRES_CONNECTION_URI"
            value = "postgres://${random_password.placenl-db-user-username.result}:${random_password.placenl-db-user-password.result}@placenl-db-service/postgres"
          }
        }
        volume {
          name = "placenl-image-pv"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.placenl-image-pvc.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "placenl-app-service" {
  metadata {
    name      = "placenl-app-service"
    namespace = kubernetes_namespace.placenl-namespace.metadata[0].name
  }
  spec {
    selector = {
      app = "placenl"
    }
    port {
      target_port = "3000"
      port        = "3000"
    }
  }
}

provider "kubectl" {
  host  = data.digitalocean_kubernetes_cluster.doks.endpoint
  token = data.digitalocean_kubernetes_cluster.doks.kube_config[0].token
  cluster_ca_certificate = base64decode(
    data.digitalocean_kubernetes_cluster.doks.kube_config[0].cluster_ca_certificate
  )
  load_config_file       = false
}

resource "kubectl_manifest" "placenl-ingress" {
  yaml_body = file("./ingress.yml")
}