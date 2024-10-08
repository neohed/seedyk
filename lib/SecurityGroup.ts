import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { IVpc } from 'aws-cdk-lib/aws-ec2';

interface IngressRule {
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];  // Optional to allow group-based rules
  sourceSecurityGroups?: ec2.ISecurityGroup[];  // Allow references to other security groups
}

interface EgressRule {
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];  // Optional to allow group-based rules
  destinationSecurityGroups?: ec2.ISecurityGroup[];  // Allow references to other security groups
}

interface SecurityGroupProps {
  vpcId?: string;  // Optional if not used
  vpc: IVpc;
  namePrefix: string;
  ingressRules: IngressRule[];
  egressRules?: EgressRule[];
}

export class SecurityGroup extends Construct {
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id);

    const allowAllOutbound = props.egressRules?.some(rule =>
      rule.protocol === '-1' &&
      rule.fromPort === 0 &&
      rule.toPort === 0 &&
      rule.cidrBlocks?.includes('0.0.0.0/0')
    ) ?? false;

    this.securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      securityGroupName: `${props.namePrefix}-SG`,
      allowAllOutbound, // Set allowAllOutbound based on the egress rules
    });

    // Add Ingress Rules
    props.ingressRules.forEach(rule => {
      // If CIDR blocks are provided, add them as peer rules
      rule.cidrBlocks?.forEach(cidrBlock => {
        this.securityGroup.addIngressRule(
          ec2.Peer.ipv4(cidrBlock),
          new ec2.Port({
            protocol: ec2.Protocol[rule.protocol.toUpperCase() as keyof typeof ec2.Protocol],
            stringRepresentation: `${rule.fromPort}-${rule.toPort}`,
            fromPort: rule.fromPort,
            toPort: rule.toPort
          })
        );
      });

      // If source security groups are provided, add them as peer rules
      rule.sourceSecurityGroups?.forEach(sg => {
        this.securityGroup.addIngressRule(
          ec2.Peer.securityGroupId(sg.securityGroupId),
          new ec2.Port({
            protocol: ec2.Protocol[rule.protocol.toUpperCase() as keyof typeof ec2.Protocol],
            stringRepresentation: `${rule.fromPort}-${rule.toPort}`,
            fromPort: rule.fromPort,
            toPort: rule.toPort
          })
        );        
      });
    });

    // Add Egress Rules if not allowAllOutbound
    if (!allowAllOutbound) {
      (props.egressRules || []).forEach(rule => {
        // If CIDR blocks are provided, add them as peer rules
        rule.cidrBlocks?.forEach(cidrBlock => {
          this.securityGroup.addEgressRule(
            ec2.Peer.ipv4(cidrBlock),
            new ec2.Port({
              protocol: rule.protocol === "-1"
                ? ec2.Protocol.ALL
                : ec2.Protocol[rule.protocol.toUpperCase() as keyof typeof ec2.Protocol],
              stringRepresentation: `${rule.fromPort}-${rule.toPort}`,
              fromPort: rule.fromPort,
              toPort: rule.toPort
            })
          );
        });

        // If destination security groups are provided, add them as peer rules
        rule.destinationSecurityGroups?.forEach(sg => {
          this.securityGroup.addEgressRule(
            ec2.Peer.securityGroupId(sg.securityGroupId),
            new ec2.Port({
              protocol: rule.protocol === "-1"
                ? ec2.Protocol.ALL
                : ec2.Protocol[rule.protocol.toUpperCase() as keyof typeof ec2.Protocol],
              stringRepresentation: `${rule.fromPort}-${rule.toPort}`,
              fromPort: rule.fromPort,
              toPort: rule.toPort
            })
          );          
        });
      });
    }
  }
}
