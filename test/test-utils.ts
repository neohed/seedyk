import { IVpc, Vpc, SubnetType, IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs/lib/construct';

export function mockVpc(scope: Construct, vpcId: string): IVpc {
  return new Vpc(scope, vpcId, {
    ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
    maxAzs: 2,  // Number of Availability Zones
    subnetConfiguration: [
      {
        cidrMask: 26,
        name: 'publicSubnet',
        subnetType: SubnetType.PUBLIC,
      },
      {
        cidrMask: 26,
        name: 'privateSubnet',
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    ],
    natGateways: 0  // No NAT Gateways for simplicity
  });
}
