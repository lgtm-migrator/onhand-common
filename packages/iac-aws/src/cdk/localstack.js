/* eslint-disable @typescript-eslint/no-var-requires */
const provider = require('aws-cdk/lib/api/aws-auth/sdk-provider')
const { CdkToolkit } = require('aws-cdk/lib/cdk-toolkit')
const { SDK } = require('aws-cdk/lib/api/aws-auth/sdk')
const {
  BUCKET_NAME_OUTPUT,
  BUCKET_DOMAIN_NAME_OUTPUT,
} = require('aws-cdk/lib/api/bootstrap/bootstrap-props')
const { ToolkitInfo } = require('aws-cdk/lib/api')

const DEFAULT_EDGE_PORT = 4566
const DEFAULT_HOSTNAME = 'localhost'

// ----------------
// UTIL FUNCTIONS
// ----------------

const getLocalEndpoint = () => {
  const port = process.env.EDGE_PORT || DEFAULT_EDGE_PORT
  const host = process.env.LOCALSTACK_HOSTNAME || DEFAULT_HOSTNAME
  return `http://${host}:${port}`
}

const useLocal = options => {
  if ('localstack' in options) {
    return !!options.localstack
  }
  return process.env.USE_LOCAL ? Boolean(process.env.USE_LOCAL) : false
}

const setOptions = (options, setHttpOptions) => {
  if (!useLocal(options)) return
  if (setHttpOptions) {
    options = options.httpOptions = options.httpOptions || {}
  }
  options.endpoint = getLocalEndpoint()
  options.s3ForcePathStyle = true
  options.accessKeyId = 'test'
  options.secretAccessKey = 'test'
}

const getMethods = obj => {
  const properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  const excluded = [
    'caller',
    'callee',
    'arguments',
    'constructor',
    'isPrototypeOf',
    'hasOwnProperty',
    'valueOf',
    'toString',
    'toLocaleString',
    'propertyIsEnumerable',
  ]
  const props = [...properties.keys()].filter(
    p => !excluded.includes(p) && !p.startsWith('__'),
  )
  return props.filter(item => typeof obj[item] === 'function')
}

// ---------
// PATCHES
// ---------

const origConstr = provider.SdkProvider.withAwsCliCompatibleDefaults
provider.SdkProvider.withAwsCliCompatibleDefaults = async (options = {}) => {
  setOptions(options, true)
  return origConstr(options)
}

provider.SdkProvider.prototype.defaultCredentials = () => {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  }
}

const currentAccount = SDK.prototype.currentAccount
SDK.prototype.currentAccount = async function () {
  const config = this.config
  setOptions(config)
  return currentAccount.bind(this)()
}

getMethods(CdkToolkit.prototype).forEach(meth => {
  const original = CdkToolkit.prototype[meth]
  CdkToolkit.prototype[meth] = function () {
    setOptions(this.props.sdkProvider.sdkOptions)
    return original.bind(this).apply(this, arguments)
  }
})

Object.defineProperty(ToolkitInfo.prototype, 'bucketUrl', {
  get () {
    const bucket = this.requireOutput(BUCKET_NAME_OUTPUT)
    const domain = this.requireOutput(BUCKET_DOMAIN_NAME_OUTPUT)
    return `https://${domain.replace(`${bucket}.`, '')}/${bucket}`
  },
})
