import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityGroup } from '../lib/SecurityGroup';
import { mockVpc } from './test-utils';

test('Security Group Created with Correct Ingress Rules', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'TestStack');
  const vpc = mockVpc(stack, 'MockVPC');

  new SecurityGroup(stack, 'TestSecurityGroup', {
    vpc,
    vpcId: vpc.vpcId,
    namePrefix: 'test-sg',
    ingressRules: [
      {
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16']
      },
      {
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16']
      }
    ],
    egressRules: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0']
      }
    ]
  });

  const template = Template.fromStack(stack);

  // Log the full CloudFormation template for inspection
  // console.log(JSON.stringify(template.toJSON(), null, 2));

   // Assert that the security group exists with the correct name and description
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    GroupDescription: "TestStack/TestSecurityGroup/SecurityGroup",
    GroupName: "test-sg-SG",
    VpcId: {
      "Ref": "MockVPCEA6DBF1E"
    }
  });

  // Assert that the ingress rules exist
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: Match.arrayWith([
      Match.objectLike({
        CidrIp: '10.0.0.0/16',
        FromPort: 80,
        ToPort: 80,
        IpProtocol: 'tcp',
        Description: 'from 10.0.0.0/16:80-80'
      }),
      Match.objectLike({
        CidrIp: '10.0.0.0/16',
        FromPort: 443,
        ToPort: 443,
        IpProtocol: 'tcp',
        Description: 'from 10.0.0.0/16:443-443'
      })
    ])
  });

  // Assert that the egress rule exists without FromPort and ToPort since IpProtocol is "-1"
  template.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupEgress: Match.arrayWith([
      Match.objectLike({
        CidrIp: '0.0.0.0/0',
        IpProtocol: '-1',
        Description: 'Allow all outbound traffic by default'
      })
    ])
  });
});