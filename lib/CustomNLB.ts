import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';

interface NlbProps {
  vpc: ec2.Vpc;
  domains: string[];
}

export class CustomNlb extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: NlbProps) {
    super(scope, id);

    // Create the Elastic IPs for each subnet
    const elasticIps: ec2.CfnEIP[] = props.vpc.availabilityZones.map((_, index) => {
      return new ec2.CfnEIP(this, `EIP${index}`);
    });

    // Create a Network Load Balancer
    const nlb = new elbv2.CfnLoadBalancer(this, 'MyNlb', {
      name: 'MyNlb',
      scheme: 'internet-facing',
      type: 'network',
      subnetMappings: props.vpc.publicSubnets.map((subnet, index) => ({
        subnetId: subnet.subnetId,
        allocationId: elasticIps[index].attrAllocationId,
      })),
    });

    //TODO: ...
  }
}
