import crypto from 'crypto';
import {compose, join, pluck, map, path, forEach} from 'ramda';
import {singular} from 'pluralize';
import {SOURCE_NAME, DEBUG_MODE} from './constants';

// Get the type name back from a formatted type name.
export const extractTypeName = t => {
  /*
  t = singular(/(.+)(?:s|es)/gi.exec(t)[1]);
  if (t == "tagFamilie") {
    t = "tagFamilies";
  }
  */
  return t;
};

/**
 * Create parent id for elements.
 * 
 * @param {*} e Element data to be used
 * @param {*} type Type of the element
 */
export const constructParentId = (e, type) => {
  if (e.parent && e.parent.uuid) {
    return createId(e.parent.uuid, type);
  }
  return null;
};

/**
 * Create array with ids of children.
 * 
 * @param {*} e Element data to be used
 * @param {*} type Type of the element
 */
export const constructChildIds = (e, type) => {
  if (e.children && e.children.elements) {
    return Object.values(e.children.elements).map(function(v) { return createId(v.uuid, type); });
  } else  {
    return [];
  }
};

/**
 * Constructs a global gatsby id from the element uuid and type.
 * 
 * @param {*} uuid 
 * @param {*} type 
 */
export const createId = (uuid, type) => {
  return crypto.createHash(`md5`).update(uuid + ":" + type).digest(`hex`)
};

/**
 * Create a gatsby node from the input value.
 * 
 * @param {*} createNode Gatsby create method
 * @param {*} reporter Logger
 * @param {*} value Object which holds the element data
 * @param {*} key Key or type of the element
 */
export const createNodeFromData =  (createNode, reporter, value, key) => {
  // rename fields property since 'fields' is reserved by gatsby
  if (value.fields)  {
    value.data = value.fields;
    delete value.fields;
  }
  if (!value.uuid) {
    reporter.panic(`The object for property ${key} did not contain a uuid property. This property is mandatory in order to setup the gatsby nodes. Omitting value.`);
    return
  }
  value.id = createId(value.uuid, key);

  const {id, ...fields} = value;
  const jsonNode = JSON.stringify(value);

  const gatsbyNode = {
    id: value.id,
    ...fields,
    parent: constructParentId(value, key),
    //children: constructChildIds(value, key),
    children: [],
    internal: {
      type: key,
      content: jsonNode,
      contentDigest: crypto.createHash(`md5`).update(jsonNode).digest(`hex`)
    }
  };

  if (DEBUG_MODE) {
    const jsonFields = JSON.stringify(fields, null, 2);
    const jsonGatsbyNode = JSON.stringify(gatsbyNode, null, 2);
    reporter.info(`  processing node: ${jsonNode}`);
    reporter.info(`    node id ${id}`);
    reporter.info(`    node fields: ${jsonFields}`);
    reporter.info(`    gatsby node: ${jsonGatsbyNode}`);
  }

  createNode(gatsbyNode);
  return gatsbyNode;
};

/**
 * Creates nodes from the input value. This method will also handle arrays of input data.
 * 
 * @param {*} boundActionCreators
 * @param {*} reporter Logger
 */
export const createNodes = (boundActionCreators, reporter) => (value, key) => {
  const {createNode, createParentChildLink} = boundActionCreators;
  key = extractTypeName(key);

  // Check whether the found value contains multiple elements
  if (value.elements) {
    let relations = [];
    let nodes = {};
    forEach(queryResultNode => {

      let gatsbyNode = createNodeFromData(createNode, reporter, queryResultNode, key);

      // Store relational information about nodes so that we can later constuct the links
      if (key == "nodes") {
        let childrenIds = constructChildIds(queryResultNode, key);
        relations.push({"parentId": gatsbyNode.id, "childrenIds": childrenIds});
        nodes[gatsbyNode.id] = gatsbyNode;
      }
    }, value.elements);

    // Now that all nodes have been created we can setup the relations
    forEach(rel => {
      forEach(childId => {
        let child = nodes[childId];
        let parent = nodes[rel.parentId];
        if (child && parent) {
          createParentChildLink({ parent: parent, child: child });
        } else {
          reporter.warn("Unable to create parent-child relationship between " + rel.parent + " and " + childId);
        }
      }, rel.childrenIds);
    }, relations);
  } else {
    createNodeFromData(createNode, reporter, value, key);
  }

};
