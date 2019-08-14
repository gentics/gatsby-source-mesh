# Project Deprecated

Use https://www.gatsbyjs.org/packages/gatsby-source-graphql/ instead.

#### Example: [@gentics/gatsby-mesh-example](https://github.com/gentics/gatsby-mesh-example)

# gatsby-source-mesh

Source plugin for pulling data into [Gatsby](https://github.com/gatsbyjs) from a [Gentics Mesh](https://getmesh.io) endpoint.

## Install

1. `yarn add gatsby-source-mesh` or `npm i gatsby-source-mesh`
1. Make sure plugin is referenced in your Gatsby config, as in the
   [example&nbsp;below](#usage)
1. `gatsby develop`

## Testing plugin contributions

1. `cd` to the Gatsby install you want to test your changes to the plugin code
   with, or clone [@gentics/gatsby-mesh-example](https://github.com/gentics/gatsby-mesh-example)
1. If you cloned the example or previously installed the plugin through `yarn`
   or `npm`, `yarn remove gatsby-source-mesh` or `npm r
   gatsby-source-mesh`
1. `mkdir plugins` if it does not exist yet and `cd` into it
1. Your path should now be something like
   `~/code/mesh/myKillerGatsbySite/plugins/`
1. `git clone https://github.com/gentics/gatsby-source-mesh.git`
1. `cd gatsby-source-mesh`
1. `yarn` or `yarn && yarn watch` in plugin’s directory for auto-rebuilding the
   plugin after you make changes to it—only during development
1. Make sure plugin is referenced in your Gatsby config, as in the
   [example&nbsp;below](#usage)
1. From there you can `cd ../.. && yarn && yarn develop` to test

### Every time you rebuild the plugin, you must restart Gatsby’s development server to reflect the changes in your test environment.

## Usage

_In your gatsby config..._

```javascript
plugins: [
  {
    resolve: `gatsby-source-mesh`,
    options: {
      endpoint: `graphql_endpoint`,
      token: `graphql_token`,
      query: `{
           me {
             uuid
             username
           }
           nodes {
            elements {
              uuid
              schema {
                name
                uuid
              }
              parent {
                uuid
              }
              children {
                elements {
                  uuid
                }
              }
              path
              fields {
                ... on vehicle {
                  name
                  description
                  vehicleImage {
                    uuid
                    path
                    fields {
                      ... on vehicleImage {
                        image {
                          width
                          height
                        }
                      }
                    }
                  }
                }
                ... on category {
                  name
                  slug
                  description
                }
                ... on vehicleImage {
                  name
                  image {
                    fileName
                    width
                    height
                  }
                }
              }
            }
          }
        }`,
    },
  }
],
```

Gatsby’s data processing layer begins with “source” plugins, configured in `gatsby-config.js`. 
Here the site sources its data from the Gentics Mesh endpoint.
Use an `.env` file or set environment variables directly to access the Gentics Mesh endpoint and token. 
This avoids committing potentially sensitive data.

## Plugin options

|              |                                                                   |
| -----------: | :---------------------------------------------------------------- |
| **endpoint** | Indicates the endpoint to use for the graphql connection. The graphql URL will also be used to select your project. Example: https://demo.getmesh.io/api/v1/demo/graphql  |
|    **token** | The API access token. By default the anonoymous user will be used. |
|    **query** | The GraphQL query to execute against the endpoint. The parent/children properties should always be added otherwise the relationships between the nodes can't be created. Currently only agreggation fields (nodes, users, roles...) can be used.|

## How to query : GraphQL

This source plugin will load all nodes of Gentics Mesh and transform them into gatsby nodes. If you want to load specific fields of a node you need to adapt the query within your `gatsby-config.js` and include the fields.

## Current limitations

### No automatic paging ###

The aggregation results will not be automatically be paged and thus only the specified amount of elements will be loaded. (default: 25)

You can however increase the page size this way:

```
{
  nodes(perPage: 1000) {
    elements {
      uuid
    }
  }
}
```

### Multilanguage support ###

Mutlilanguage support has not yet been tested.

You can however load all language variants of a node this way:

```
{
  nodes {
    elements {
      uuid
      languages {
        fields {
          ... on vehicle {
            slug
          }
        }
      }
    }
  }
}
```

#### `length` must be aliased

If you have a field named `length` it must be aliased to something else like so:
`myLength: length`. This is due to internal limitations of Gatsby’s GraphQL
implementation.

## Other TODOs

* Add better multilanguage handling

## Fork

This source plugin is a modified fork of the [gatsby-source-graphcms plugin](https://github.com/GraphCMS/gatsby-source-graphcms).
