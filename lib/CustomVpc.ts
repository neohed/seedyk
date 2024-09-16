import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface CustomVpcProps {
  cidr: string;
  maxAzs: number;
  createIgw?: boolean; // Optional flag to create an Internet Gateway
  publicSubnets?: boolean; // Whether to create public subnets
  privateSubnets?: boolean; // Whether to create private subnets
  additionalTags?: { [key: string]: string }; // Optional additional tags
}

export class CustomVpc extends cdk.Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: CustomVpcProps) {
    super(scope, id);

    const additionalTags = props.additionalTags || {};

    // Create the VPC
    this.vpc = new ec2.Vpc(this, 'MyCustomVpc', {
      cidr: props.cidr,
      maxAzs: props.maxAzs,
      subnetConfiguration: this.createSubnetConfig(props),
      natGateways: props.privateSubnets ? 1 : 0, // Enable NAT if there are private subnets
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    // Add additional tags
    cdk.Tags.of(this.vpc).add('Name', id);
    for (const [key, value] of Object.entries(additionalTags)) {
      cdk.Tags.of(this.vpc).add(key, value);
    }

    // Optionally, add an Internet Gateway
    if (props.createIgw) {
      new ec2.CfnInternetGateway(this, 'InternetGateway', {
        tags: [{ key: 'Name', value: `${id}-igw` }],
      });
    }
  }

  private createSubnetConfig(props: CustomVpcProps): ec2.SubnetConfiguration[] {
    const subnetConfig: ec2.SubnetConfiguration[] = [];

    if (props.publicSubnets) {
      subnetConfig.push({
        cidrMask: 24,
        name: 'PublicSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      });
    }

    if (props.privateSubnets) {
      subnetConfig.push({
        cidrMask: 24,
        name: 'PrivateSubnet',
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      });
    }

    return subnetConfig;
  }
}
