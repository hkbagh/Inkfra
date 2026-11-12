ENV ?= dev
TF  ?= terraform

.PHONY: init fmt validate lint plan apply destroy

init:
	$(TF) init

fmt:
	$(TF) fmt -recursive

validate:
	$(TF) fmt -check -recursive
	$(TF) init -backend=false
	$(TF) validate

lint:
	tflint --init && tflint -f compact

plan:
	$(TF) plan -var-file=environments/$(ENV)/terraform.tfvars -out=tfplan

apply:
	$(TF) apply -auto-approve tfplan

destroy:
	$(TF) destroy -var-file=environments/$(ENV)/terraform.tfvars
