import type { ResourceDef, PropertyDef } from '../types/ir'

const str = (key: string, label: string, def?: string, ph?: string, required = false): PropertyDef => ({
  key, label, type: 'string', default: def, placeholder: ph, ...(required ? { required: true } : {}),
})
const num = (key: string, label: string, def?: number, required = false): PropertyDef => ({
  key, label, type: 'number', default: def, ...(required ? { required: true } : {}),
})
const bool = (key: string, label: string, def?: boolean): PropertyDef => ({
  key, label, type: 'boolean', default: def,
})
const sel = (key: string, label: string, opts: string[], def?: string, required = false): PropertyDef => ({
  key, label, type: 'select', options: opts.map(o => ({ label: o, value: o })), default: def ?? opts[0], ...(required ? { required: true } : {}),
})
const txt = (key: string, label: string, def?: string, required = false): PropertyDef => ({
  key, label, type: 'textarea', default: def, ...(required ? { required: true } : {}),
})

const R = (d: Partial<ResourceDef> & Pick<ResourceDef, 'type' | 'label' | 'provider' | 'category' | 'icon' | 'color'>): ResourceDef => ({
  properties: [],
  size: { w: 180, h: 72 },
  ...d,
})

export const catalog: ResourceDef[] = [
  // ---------- Generic / conceptual ----------
  R({ type: 'generic_user', label: 'User / Client', provider: 'generic', category: 'generic', icon: 'User', color: '#94a3b8', description: 'End user or client', properties: [str('name','Name','client'), str('location','Location','internet')] }),
  R({ type: 'generic_internet', label: 'Internet', provider: 'generic', category: 'network', icon: 'Globe', color: '#38bdf8', properties: [] }),
  R({ type: 'generic_server', label: 'Server', provider: 'generic', category: 'compute', icon: 'Server', color: '#64748b', properties: [str('os','OS','linux'), num('cpu','CPU cores',2), num('ram','RAM GB',4)] }),
  R({ type: 'generic_database', label: 'Database', provider: 'generic', category: 'database', icon: 'Database', color: '#a78bfa', properties: [str('engine','Engine','postgres'), str('version','Version','15')] }),
  R({ type: 'generic_cache', label: 'Cache', provider: 'generic', category: 'storage', icon: 'Zap', color: '#fbbf24', properties: [str('engine','Engine','redis')] }),
  R({ type: 'generic_queue', label: 'Queue', provider: 'generic', category: 'messaging', icon: 'ListOrdered', color: '#fb7185', properties: [str('name','Name','queue')] }),
  R({ type: 'generic_loadbalancer', label: 'Load Balancer', provider: 'generic', category: 'network', icon: 'Split', color: '#34d399', properties: [sel('algo','Algorithm',['round-robin','least-conn','ip-hash'],'round-robin')] }),
  R({ type: 'generic_firewall', label: 'Firewall', provider: 'generic', category: 'security', icon: 'Shield', color: '#ef4444', properties: [txt('rules','Rules','allow 443')] }),
  R({ type: 'generic_cdn', label: 'CDN', provider: 'generic', category: 'network', icon: 'Cloud', color: '#22d3ee', properties: [] }),
  R({ type: 'generic_storage', label: 'Object Storage', provider: 'generic', category: 'storage', icon: 'HardDrive', color: '#8b5cf6', properties: [str('bucket','Bucket name','assets')] }),
  // ---------- AWS ----------
  R({ type: 'aws_vpc', label: 'VPC', provider: 'aws', category: 'network', icon: 'Network', color: '#ff9900', terraformType: 'aws_vpc', container: true, description: 'Virtual Private Cloud', properties: [str('cidr_block','CIDR Block','10.0.0.0/16','10.0.0.0/16',true), str('name','Name','main-vpc'), bool('enable_dns_hostnames','DNS Hostnames',true), bool('enable_dns_support','DNS Support',true)] }),
  R({ type: 'aws_subnet', label: 'Subnet', provider: 'aws', category: 'network', icon: 'Layers', color: '#ff9900', terraformType: 'aws_subnet', container: true, properties: [str('cidr_block','CIDR Block','10.0.1.0/24','10.0.1.0/24',true), sel('availability_zone','AZ',['us-east-1a','us-east-1b','us-east-1c'],'us-east-1a'), bool('map_public_ip_on_launch','Public IP',false), str('name','Name','subnet')] }),
  R({ type: 'aws_internet_gateway', label: 'Internet Gateway', provider: 'aws', category: 'network', icon: 'Globe', color: '#ff9900', terraformType: 'aws_internet_gateway', properties: [str('name','Name','igw')] }),
  R({ type: 'aws_nat_gateway', label: 'NAT Gateway', provider: 'aws', category: 'network', icon: 'ArrowRightLeft', color: '#ff9900', terraformType: 'aws_nat_gateway', properties: [str('name','Name','nat'), sel('connectivity_type','Connectivity',['public','private'],'private')] }),
  R({ type: 'aws_route_table', label: 'Route Table', provider: 'aws', category: 'network', icon: 'Route', color: '#ff9900', terraformType: 'aws_route_table', properties: [str('name','Name','rt')] }),
  R({ type: 'aws_security_group', label: 'Security Group', provider: 'aws', category: 'security', icon: 'Shield', color: '#ff9900', terraformType: 'aws_security_group', properties: [str('name','Name','sg','',true), str('description','Description','Managed by Inkfra'), txt('ingress','Ingress rules','tcp 443 0.0.0.0/0'), txt('egress','Egress rules','all 0.0.0.0/0')] }),
  R({ type: 'aws_ec2_instance', label: 'EC2 Instance', provider: 'aws', category: 'compute', icon: 'Server', color: '#ff9900', terraformType: 'aws_instance', properties: [str('ami','AMI (blank = latest Amazon Linux)','auto','auto or ami-...'), sel('instance_type','Instance Type',['t3.micro','t3.small','t3.medium','m5.large','c5.large'],'t3.micro',true), str('key_name','Key Pair',''), num('root_volume_size','Root Volume GB',20), str('name','Name','ec2')] }),
  R({ type: 'aws_lb', label: 'Load Balancer (ALB/NLB)', provider: 'aws', category: 'network', icon: 'Split', color: '#ff9900', terraformType: 'aws_lb', properties: [sel('load_balancer_type','Type',['application','network','gateway'],'application'), bool('internal','Internal',false), str('name','Name','alb','',true)] }),
  R({ type: 'aws_lb_target_group', label: 'Target Group', provider: 'aws', category: 'network', icon: 'Target', color: '#ff9900', terraformType: 'aws_lb_target_group', properties: [num('port','Port',80,true), sel('protocol','Protocol',['HTTP','HTTPS','TCP'],'HTTP',true), str('name','Name','tg','',true)] }),
  R({ type: 'aws_lb_listener', label: 'LB Listener', provider: 'aws', category: 'network', icon: 'Ear', color: '#ff9900', terraformType: 'aws_lb_listener', properties: [num('port','Port',443,true), sel('protocol','Protocol',['HTTP','HTTPS','TCP'],'HTTPS',true)] }),
  R({ type: 'aws_s3_bucket', label: 'S3 Bucket', provider: 'aws', category: 'storage', icon: 'HardDrive', color: '#ff9900', terraformType: 'aws_s3_bucket', properties: [str('bucket','Bucket Name','my-bucket','',true), sel('acl','ACL',['private','public-read'],'private'), bool('versioning','Versioning',false)] }),
  R({ type: 'aws_rds_instance', label: 'RDS Instance', provider: 'aws', category: 'database', icon: 'Database', color: '#ff9900', terraformType: 'aws_db_instance', properties: [sel('engine','Engine',['postgres','mysql','mariadb','oracle','sqlserver'],'postgres',true), str('engine_version','Version','15'), sel('instance_class','Class',['db.t3.micro','db.t3.small','db.m5.large'],'db.t3.micro',true), num('allocated_storage','Storage GB',20,true), str('username','Username','admin','',true), str('password','Password',''), bool('skip_final_snapshot','Skip Final Snapshot',true), str('name','DB Name','appdb')] }),
  R({ type: 'aws_dynamodb_table', label: 'DynamoDB Table', provider: 'aws', category: 'database', icon: 'Table', color: '#ff9900', terraformType: 'aws_dynamodb_table', properties: [str('name','Table Name','table','',true), str('hash_key','Hash Key','id','',true), sel('billing_mode','Billing',['PAY_PER_REQUEST','PROVISIONED'],'PAY_PER_REQUEST')] }),
  R({ type: 'aws_elasticache_cluster', label: 'ElastiCache', provider: 'aws', category: 'database', icon: 'Zap', color: '#ff9900', terraformType: 'aws_elasticache_cluster', properties: [sel('engine','Engine',['redis','memcached'],'redis'), str('node_type','Node Type','cache.t3.micro'), num('num_cache_nodes','Nodes',1)] }),
  R({ type: 'aws_lambda_function', label: 'Lambda Function', provider: 'aws', category: 'compute', icon: 'FunctionSquare', color: '#ff9900', terraformType: 'aws_lambda_function', properties: [str('function_name','Function Name','fn','',true), sel('runtime','Runtime',['nodejs20.x','python3.12','go1.x','java21'],'nodejs20.x',true), str('handler','Handler','index.handler','',true), num('memory_size','Memory MB',128), num('timeout','Timeout s',30)] }),
  R({ type: 'aws_eks_cluster', label: 'EKS Cluster', provider: 'aws', category: 'platform', icon: 'Boxes', color: '#ff9900', terraformType: 'aws_eks_cluster', properties: [str('name','Cluster Name','eks'), str('version','K8s Version','1.30')] }),
  R({ type: 'aws_ecr_repository', label: 'ECR Repository', provider: 'aws', category: 'storage', icon: 'Container', color: '#ff9900', terraformType: 'aws_ecr_repository', properties: [str('name','Repository Name','repo')] }),
  R({ type: 'aws_ecs_cluster', label: 'ECS Cluster', provider: 'aws', category: 'platform', icon: 'Boxes', color: '#ff9900', terraformType: 'aws_ecs_cluster', properties: [str('name','Cluster Name','ecs')] }),
  R({ type: 'aws_sqs_queue', label: 'SQS Queue', provider: 'aws', category: 'messaging', icon: 'ListOrdered', color: '#ff9900', terraformType: 'aws_sqs_queue', properties: [str('name','Queue Name','queue'), bool('fifo_queue','FIFO',false)] }),
  R({ type: 'aws_sns_topic', label: 'SNS Topic', provider: 'aws', category: 'messaging', icon: 'Bell', color: '#ff9900', terraformType: 'aws_sns_topic', properties: [str('name','Topic Name','topic')] }),
  R({ type: 'aws_cloudfront_distribution', label: 'CloudFront', provider: 'aws', category: 'network', icon: 'Cloud', color: '#ff9900', terraformType: 'aws_cloudfront_distribution', properties: [str('comment','Comment','cdn')] }),
  R({ type: 'aws_route53_zone', label: 'Route53 Hosted Zone', provider: 'aws', category: 'network', icon: 'Globe2', color: '#ff9900', terraformType: 'aws_route53_zone', properties: [str('name','Domain Name','example.com')] }),
  R({ type: 'aws_iam_role', label: 'IAM Role', provider: 'aws', category: 'identity', icon: 'Key', color: '#ff9900', terraformType: 'aws_iam_role', properties: [str('name','Role Name','role'), txt('assume_role_policy','Assume Role Policy','{}')] }),
  R({ type: 'aws_iam_policy', label: 'IAM Policy', provider: 'aws', category: 'identity', icon: 'FileKey', color: '#ff9900', terraformType: 'aws_iam_policy', properties: [str('name','Policy Name','policy'), txt('policy','Policy JSON','{}')] }),
  R({ type: 'aws_kinesis_stream', label: 'Kinesis Stream', provider: 'aws', category: 'messaging', icon: 'Activity', color: '#ff9900', terraformType: 'aws_kinesis_stream', properties: [str('name','Stream Name','stream'), num('shard_count','Shards',1)] }),
  R({ type: 'aws_api_gateway', label: 'API Gateway', provider: 'aws', category: 'network', icon: 'Waypoints', color: '#ff9900', terraformType: 'aws_api_gateway_rest_api', properties: [str('name','API Name','api')] }),
  R({ type: 'aws_cognito_user_pool', label: 'Cognito User Pool', provider: 'aws', category: 'identity', icon: 'Users', color: '#ff9900', terraformType: 'aws_cognito_user_pool', properties: [str('name','Pool Name','pool')] }),
  R({ type: 'aws_ssm_parameter', label: 'SSM Parameter', provider: 'aws', category: 'security', icon: 'Lock', color: '#ff9900', terraformType: 'aws_ssm_parameter', properties: [str('name','Name','/app/key'), str('value','Value',''), sel('type','Type',['String','SecureString'],'String')] }),

  // ---------- Azure ----------
  R({ type: 'azurerm_resource_group', label: 'Resource Group', provider: 'azure', category: 'platform', icon: 'Folder', color: '#0078d4', terraformType: 'azurerm_resource_group', container: true, properties: [str('name','Name','rg','',true), str('location','Location','eastus','',true)] }),
  R({ type: 'azurerm_virtual_network', label: 'Virtual Network', provider: 'azure', category: 'network', icon: 'Network', color: '#0078d4', terraformType: 'azurerm_virtual_network', container: true, properties: [str('name','Name','vnet','',true), str('address_space','Address Space','10.0.0.0/16','',true), str('location','Location','eastus')] }),
  R({ type: 'azurerm_subnet', label: 'Subnet', provider: 'azure', category: 'network', icon: 'Layers', color: '#0078d4', terraformType: 'azurerm_subnet', container: true, properties: [str('name','Name','subnet','',true), str('address_prefixes','CIDRs','10.0.1.0/24','',true)] }),
  R({ type: 'azurerm_network_security_group', label: 'NSG', provider: 'azure', category: 'security', icon: 'Shield', color: '#0078d4', terraformType: 'azurerm_network_security_group', properties: [str('name','Name','nsg'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_virtual_machine', label: 'Virtual Machine', provider: 'azure', category: 'compute', icon: 'Server', color: '#0078d4', terraformType: 'azurerm_linux_virtual_machine', properties: [str('name','Name','vm'), str('size','Size','Standard_B1s'), str('admin_username','Admin User','azureuser'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_storage_account', label: 'Storage Account', provider: 'azure', category: 'storage', icon: 'HardDrive', color: '#0078d4', terraformType: 'azurerm_storage_account', properties: [str('name','Name','storageacct'), sel('account_tier','Tier',['Standard','Premium'],'Standard'), sel('account_replication_type','Replication',['LRS','GRS','ZRS'],'LRS'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_sql_server', label: 'SQL Server', provider: 'azure', category: 'database', icon: 'Database', color: '#0078d4', terraformType: 'azurerm_mssql_server', properties: [str('name','Name','sqlserver'), str('administrator_login','Admin Login','sqladmin'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_kubernetes_cluster', label: 'AKS Cluster', provider: 'azure', category: 'platform', icon: 'Boxes', color: '#0078d4', terraformType: 'azurerm_kubernetes_cluster', properties: [str('name','Name','aks'), str('location','Location','eastus'), num('default_node_pool_count','Node Count',2)] }),
  R({ type: 'azurerm_container_registry', label: 'Container Registry', provider: 'azure', category: 'storage', icon: 'Container', color: '#0078d4', terraformType: 'azurerm_container_registry', properties: [str('name','Name','acr'), sel('sku','SKU',['Basic','Standard','Premium'],'Basic'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_load_balancer', label: 'Load Balancer', provider: 'azure', category: 'network', icon: 'Split', color: '#0078d4', terraformType: 'azurerm_lb', properties: [str('name','Name','lb'), sel('sku','SKU',['Basic','Standard'],'Standard')] }),
  R({ type: 'azurerm_app_service', label: 'App Service', provider: 'azure', category: 'compute', icon: 'Globe', color: '#0078d4', terraformType: 'azurerm_linux_web_app', properties: [str('name','Name','app'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_function_app', label: 'Function App', provider: 'azure', category: 'compute', icon: 'FunctionSquare', color: '#0078d4', terraformType: 'azurerm_linux_function_app', properties: [str('name','Name','func'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_cosmosdb_account', label: 'Cosmos DB', provider: 'azure', category: 'database', icon: 'Database', color: '#0078d4', terraformType: 'azurerm_cosmosdb_account', properties: [str('name','Name','cosmos'), sel('offer_type','Offer',['Standard'],'Standard'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_key_vault', label: 'Key Vault', provider: 'azure', category: 'security', icon: 'Lock', color: '#0078d4', terraformType: 'azurerm_key_vault', properties: [str('name','Name','kv'), str('location','Location','eastus'), str('tenant_id','Tenant ID','')] }),
  R({ type: 'azurerm_service_bus_namespace', label: 'Service Bus', provider: 'azure', category: 'messaging', icon: 'Send', color: '#0078d4', terraformType: 'azurerm_servicebus_namespace', properties: [str('name','Name','sb'), sel('sku','SKU',['Basic','Standard','Premium'],'Standard'), str('location','Location','eastus')] }),
  R({ type: 'azurerm_eventhub_namespace', label: 'Event Hub', provider: 'azure', category: 'messaging', icon: 'Radio', color: '#0078d4', terraformType: 'azurerm_eventhub_namespace', properties: [str('name','Name','eh'), sel('sku','SKU',['Basic','Standard','Premium'],'Standard'), str('location','Location','eastus')] }),

  // ---------- GCP ----------
  R({ type: 'google_compute_network', label: 'VPC Network', provider: 'gcp', category: 'network', icon: 'Network', color: '#4285f4', terraformType: 'google_compute_network', properties: [str('name','Name','vpc'), bool('auto_create_subnetworks','Auto Subnets',false)] }),
  R({ type: 'google_compute_subnetwork', label: 'Subnetwork', provider: 'gcp', category: 'network', icon: 'Layers', color: '#4285f4', terraformType: 'google_compute_subnetwork', properties: [str('name','Name','subnet'), str('ip_cidr_range','CIDR','10.0.1.0/24'), str('region','Region','us-central1')] }),
  R({ type: 'google_compute_firewall', label: 'Firewall Rule', provider: 'gcp', category: 'security', icon: 'Shield', color: '#4285f4', terraformType: 'google_compute_firewall', properties: [str('name','Name','fw'), txt('allowed','Allowed','tcp:80,443'), str('source_ranges','Source Ranges','0.0.0.0/0')] }),
  R({ type: 'google_compute_instance', label: 'Compute Instance', provider: 'gcp', category: 'compute', icon: 'Server', color: '#4285f4', terraformType: 'google_compute_instance', properties: [str('name','Name','vm'), str('machine_type','Machine Type','e2-medium'), str('zone','Zone','us-central1-a')] }),
  R({ type: 'google_storage_bucket', label: 'Cloud Storage Bucket', provider: 'gcp', category: 'storage', icon: 'HardDrive', color: '#4285f4', terraformType: 'google_storage_bucket', properties: [str('name','Name','bucket'), str('location','Location','US'), sel('storage_class','Class',['STANDARD','NEARLINE','COLDLINE'],'STANDARD')] }),
  R({ type: 'google_sql_database_instance', label: 'Cloud SQL', provider: 'gcp', category: 'database', icon: 'Database', color: '#4285f4', terraformType: 'google_sql_database_instance', properties: [str('name','Name','sql'), sel('database_version','Version',['POSTGRES_15','MYSQL_8_0'],'POSTGRES_15'), str('region','Region','us-central1'), str('tier','Tier','db-f1-micro')] }),
  R({ type: 'google_container_cluster', label: 'GKE Cluster', provider: 'gcp', category: 'platform', icon: 'Boxes', color: '#4285f4', terraformType: 'google_container_cluster', properties: [str('name','Name','gke'), str('location','Location','us-central1'), num('initial_node_count','Nodes',3)] }),
  R({ type: 'google_pubsub_topic', label: 'Pub/Sub Topic', provider: 'gcp', category: 'messaging', icon: 'Radio', color: '#4285f4', terraformType: 'google_pubsub_topic', properties: [str('name','Name','topic')] }),
  R({ type: 'google_cloud_run_service', label: 'Cloud Run Service', provider: 'gcp', category: 'compute', icon: 'Play', color: '#4285f4', terraformType: 'google_cloud_run_service', properties: [str('name','Name','run'), str('location','Location','us-central1')] }),
  R({ type: 'google_compute_global_address', label: 'Global Address', provider: 'gcp', category: 'network', icon: 'Globe', color: '#4285f4', terraformType: 'google_compute_global_address', properties: [str('name','Name','addr')] }),
  R({ type: 'google_iam_service_account', label: 'Service Account', provider: 'gcp', category: 'identity', icon: 'Key', color: '#4285f4', terraformType: 'google_service_account', properties: [str('account_id','Account ID','sa'), str('display_name','Display Name','SA')] }),

  // ---------- Kubernetes ----------
  R({ type: 'k8s_namespace', label: 'Namespace', provider: 'kubernetes', category: 'platform', icon: 'Folder', color: '#326ce5', terraformType: 'kubernetes_namespace', properties: [str('name','Name','default')] }),
  R({ type: 'k8s_deployment', label: 'Deployment', provider: 'kubernetes', category: 'compute', icon: 'Layers', color: '#326ce5', terraformType: 'kubernetes_deployment', properties: [str('name','Name','app'), num('replicas','Replicas',3), str('image','Image','nginx:latest'), num('port','Container Port',80)] }),
  R({ type: 'k8s_service', label: 'Service', provider: 'kubernetes', category: 'network', icon: 'Split', color: '#326ce5', terraformType: 'kubernetes_service', properties: [str('name','Name','svc'), sel('type','Type',['ClusterIP','NodePort','LoadBalancer'],'ClusterIP'), num('port','Port',80), num('target_port','Target Port',80)] }),
  R({ type: 'k8s_ingress', label: 'Ingress', provider: 'kubernetes', category: 'network', icon: 'DoorOpen', color: '#326ce5', terraformType: 'kubernetes_ingress_v1', properties: [str('name','Name','ingress'), str('host','Host','example.com'), str('path','Path','/'), str('service_name','Service Name','svc')] }),
  R({ type: 'k8s_configmap', label: 'ConfigMap', provider: 'kubernetes', category: 'platform', icon: 'FileText', color: '#326ce5', terraformType: 'kubernetes_config_map', properties: [str('name','Name','config'), txt('data','Data (YAML)','key: value')] }),
  R({ type: 'k8s_secret', label: 'Secret', provider: 'kubernetes', category: 'security', icon: 'Lock', color: '#326ce5', terraformType: 'kubernetes_secret', properties: [str('name','Name','secret'), sel('type','Type',['Opaque','kubernetes.io/tls'],'Opaque')] }),
  R({ type: 'k8s_pvc', label: 'PersistentVolumeClaim', provider: 'kubernetes', category: 'storage', icon: 'HardDrive', color: '#326ce5', terraformType: 'kubernetes_persistent_volume_claim', properties: [str('name','Name','pvc'), str('storage_class','Storage Class','standard'), str('access_modes','Access Modes','ReadWriteOnce'), str('storage','Storage','10Gi')] }),
  R({ type: 'k8s_hpa', label: 'HPA', provider: 'kubernetes', category: 'compute', icon: 'TrendingUp', color: '#326ce5', terraformType: 'kubernetes_horizontal_pod_autoscaler_v2', properties: [str('name','Name','hpa'), num('min_replicas','Min',2), num('max_replicas','Max',10), num('target_cpu','CPU %',80)] }),
  R({ type: 'k8s_statefulset', label: 'StatefulSet', provider: 'kubernetes', category: 'compute', icon: 'Layers', color: '#326ce5', terraformType: 'kubernetes_stateful_set', properties: [str('name','Name','stateful'), num('replicas','Replicas',3), str('image','Image','postgres:15')] }),
  R({ type: 'k8s_daemonset', label: 'DaemonSet', provider: 'kubernetes', category: 'compute', icon: 'Boxes', color: '#326ce5', terraformType: 'kubernetes_daemonset', properties: [str('name','Name','daemon'), str('image','Image','fluentd:latest')] }),
  R({ type: 'k8s_cronjob', label: 'CronJob', provider: 'kubernetes', category: 'compute', icon: 'Clock', color: '#326ce5', terraformType: 'kubernetes_cron_job_v1', properties: [str('name','Name','cron'), str('schedule','Schedule','0 * * * *'), str('image','Image','busybox:latest')] }),
  R({ type: 'k8s_network_policy', label: 'NetworkPolicy', provider: 'kubernetes', category: 'security', icon: 'Shield', color: '#326ce5', terraformType: 'kubernetes_network_policy', properties: [str('name','Name','np')] }),

  // ---------- Docker ----------
  R({ type: 'docker_container', label: 'Container', provider: 'docker', category: 'compute', icon: 'Container', color: '#2496ed', terraformType: 'docker_container', properties: [str('name','Name','app'), str('image','Image','nginx:latest'), num('ports_internal','Internal Port',80), num('ports_external','External Port',8080)] }),
  R({ type: 'docker_image', label: 'Image', provider: 'docker', category: 'storage', icon: 'Image', color: '#2496ed', terraformType: 'docker_image', properties: [str('name','Name','img'), str('build_path','Build Path','./')] }),
  R({ type: 'docker_network', label: 'Network', provider: 'docker', category: 'network', icon: 'Network', color: '#2496ed', terraformType: 'docker_network', properties: [str('name','Name','net')] }),
  R({ type: 'docker_volume', label: 'Volume', provider: 'docker', category: 'storage', icon: 'HardDrive', color: '#2496ed', terraformType: 'docker_volume', properties: [str('name','Name','vol')] }),

  // ---------- DevOps / CI/CD / Observability ----------
  R({ type: 'devops_github_actions', label: 'GitHub Actions', provider: 'devops', category: 'cicd', icon: 'GitBranch', color: '#2088ff', properties: [str('workflow','Workflow File','.github/workflows/infra.yml'), str('deploy_branch','Deploy Branch','main'), sel('provider_auth','Cloud Auth',['oidc','static-keys'],'oidc')] }),
  R({ type: 'devops_gitlab_ci', label: 'GitLab CI', provider: 'devops', category: 'cicd', icon: 'GitBranch', color: '#fc6d26', properties: [str('config','Config File','.gitlab-ci.yml'), str('deploy_branch','Deploy Branch','main'), sel('provider_auth','Cloud Auth',['oidc','static-keys'],'oidc')] }),
  R({ type: 'devops_jenkins', label: 'Jenkins', provider: 'devops', category: 'cicd', icon: 'Hammer', color: '#d33833', properties: [str('job','Job Name','infra-deploy'), str('deploy_branch','Deploy Branch','main')] }),
  R({ type: 'devops_argocd_app', label: 'ArgoCD Application', provider: 'devops', category: 'cicd', icon: 'Rocket', color: '#ef7b4d', properties: [str('name','Name','app'), str('repo_url','Repo URL','https://github.com/org/infra.git'), str('path','Path','k8s'), str('namespace','Destination Namespace','default')] }),
  R({ type: 'devops_terraform_module', label: 'Terraform Module', provider: 'terraform', category: 'platform', icon: 'Blocks', color: '#7b42bc', properties: [str('source','Source','./modules/vpc','',true), str('version','Version','')] }),
  R({ type: 'devops_ansible_playbook', label: 'Ansible Playbook', provider: 'devops', category: 'cicd', icon: 'Play', color: '#ee0000', properties: [str('playbook','Playbook','site.yml')] }),
  R({ type: 'devops_helm_release', label: 'Helm Release', provider: 'devops', category: 'platform', icon: 'Package', color: '#0f1689', terraformType: 'helm_release', properties: [str('name','Name','rel'), str('chart','Chart','bitnami/nginx'), str('namespace','Namespace','default')] }),
  R({ type: 'obs_prometheus', label: 'Prometheus', provider: 'devops', category: 'observability', icon: 'Activity', color: '#e6522c', properties: [str('scrape_interval','Scrape Interval','15s')] }),
  R({ type: 'obs_grafana', label: 'Grafana', provider: 'devops', category: 'observability', icon: 'BarChart3', color: '#f46800', properties: [str('admin_user','Admin User','admin')] }),
  R({ type: 'obs_datadog', label: 'Datadog Agent', provider: 'devops', category: 'observability', icon: 'Eye', color: '#632ca6', properties: [] }),
  R({ type: 'obs_elk', label: 'ELK Stack', provider: 'devops', category: 'observability', icon: 'Search', color: '#005571', properties: [] }),
  R({ type: 'sec_vault', label: 'HashiCorp Vault', provider: 'devops', category: 'security', icon: 'Lock', color: '#ffcf25', terraformType: 'vault_mount', properties: [str('path','Path','secret/')] }),
  R({ type: 'sec_cert_manager', label: 'cert-manager', provider: 'devops', category: 'security', icon: 'FileKey', color: '#3d9e4a', properties: [] }),
  R({ type: 'net_nginx', label: 'NGINX', provider: 'devops', category: 'network', icon: 'Globe', color: '#009639', properties: [num('worker_processes','Workers',4)] }),
  R({ type: 'net_haproxy', label: 'HAProxy', provider: 'devops', category: 'network', icon: 'Split', color: '#f3f3f3', properties: [] }),
  R({ type: 'msg_rabbitmq', label: 'RabbitMQ', provider: 'devops', category: 'messaging', icon: 'MessageSquare', color: '#ff6600', properties: [str('user','User','guest')] }),
  R({ type: 'msg_kafka', label: 'Kafka', provider: 'devops', category: 'messaging', icon: 'Radio', color: '#231f20', properties: [num('partitions','Partitions',3)] }),
  R({ type: 'db_postgres', label: 'PostgreSQL', provider: 'devops', category: 'database', icon: 'Database', color: '#336791', properties: [str('version','Version','15'), num('port','Port',5432)] }),
  R({ type: 'db_mysql', label: 'MySQL', provider: 'devops', category: 'database', icon: 'Database', color: '#00758f', properties: [str('version','Version','8.0'), num('port','Port',3306)] }),
  R({ type: 'db_redis', label: 'Redis', provider: 'devops', category: 'database', icon: 'Zap', color: '#dc382d', properties: [num('port','Port',6379)] }),
  R({ type: 'db_mongodb', label: 'MongoDB', provider: 'devops', category: 'database', icon: 'Database', color: '#47a248', properties: [num('port','Port',27017)] }),

  // ---------- Terraform meta ----------
  R({ type: 'tf_provider', label: 'Terraform Provider', provider: 'terraform', category: 'platform', icon: 'Plug', color: '#7b42bc', properties: [str('source','Source','hashicorp/aws'), str('version','Version','~> 5.0')] }),
  R({ type: 'tf_backend', label: 'Terraform Backend', provider: 'terraform', category: 'platform', icon: 'Cloud', color: '#7b42bc', properties: [sel('type','Backend Type',['s3','azurerm','gcs','local'],'s3'), str('bucket','Bucket / Container','my-terraform-state'), str('key','State Key','infra/terraform.tfstate'), str('region','Region','us-east-1'), bool('encrypt','Encrypt State',true), bool('use_lockfile','State Locking',true)] }),
  R({ type: 'tf_variable', label: 'Variable', provider: 'terraform', category: 'platform', icon: 'Variable', color: '#7b42bc', properties: [str('name','Name','var','',true), str('type','Type','string'), str('default','Default','')] }),
  R({ type: 'tf_output', label: 'Output', provider: 'terraform', category: 'platform', icon: 'ArrowRight', color: '#7b42bc', properties: [str('name','Name','out','',true), str('value','Value','')] }),
  R({ type: 'tf_module_call', label: 'Module Call', provider: 'terraform', category: 'platform', icon: 'Blocks', color: '#7b42bc', properties: [str('source','Source','./modules/x','',true)] }),
]

export default catalog

