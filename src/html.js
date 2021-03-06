const parse5 = require('parse5');

/**
 * Helper function used when you want to console.log(JSON.stringify(document)).
 *
 * @param  {object} document  An HTML AST
 * @return {object}           Modified AST
 */
function cleanDocument (document) {
  /**
   * Parent nodes are circular and don't allow you to JSON.stringify.
   * This function removes them.
   *
   * @param  {object}    node  A node in the HTML AST
   * @return {undefined}       Does not return anything, just mutates the object
   */
  function removeParentNodes (node) {
    delete node.parentNode;
    if (node.childNodes) {
      node.childNodes.forEach(function (child) {
        removeParentNodes(child);
      });
    }
  }
  removeParentNodes(document);

  return document;
}
cleanDocument({});

const html = function (input, processedStyles) {
  // String => Object
  const document = parse5.parse(input);

  /**
   * Finds and removes every instance of a value from an array
   *
   * @param  {Array} arr    Any array
   * @param  {any}   value  Any literal that can be compared with ===
   * @return {Array}        The mutated array
   */
  function removeEveryInstance (arr, value) {
    let i = 0;
    while (i < arr.length) {
      if (arr[i] === value) {
        arr.splice(i, 1);
      } else {
        ++i;
      }
    }
    return arr;
  }

  /**
   * Replaces all instances of a class name in class attributes in the DOM
   * with its atomized representation of class names.
   *
   * @param  {object}    node            An HTML AST node
   * @param  {string}    classToReplace  A string to find and replace
   * @param  {Array}     newClasses      Array of strings that will replace the given class
   * @return {undefined}                 Just mutates the AST. Nothing returned
   */
  function replaceSemanticClassWithAtomizedClasses (node, classToReplace, newClasses) {
    if (node.attrs) {
      node.attrs.forEach(function (attribute) {
        if (attribute.name === 'class') {
          let classes = attribute.value.split(' ');
          if (classes.includes(classToReplace)) {
            classes = removeEveryInstance(classes, classToReplace);
            classes.push(...newClasses);
          }
          attribute.value = classes.join(' ');
        }
      });
    }
    if (node.childNodes) {
      node.childNodes.forEach(function (child) {
        replaceSemanticClassWithAtomizedClasses(child, classToReplace, newClasses);
      });
    }
  }

  Object.keys(processedStyles.classMap).forEach(function (semanticClass) {
    let atomizedClasses = processedStyles.classMap[semanticClass];
    atomizedClasses = atomizedClasses.map(function (atomic) {
      return atomic.replace('.', '');
    });
    if (semanticClass.startsWith('.')) {
      semanticClass = semanticClass.replace('.', '');
    }
    replaceSemanticClassWithAtomizedClasses(document, semanticClass, atomizedClasses);
  });

  // Object => string
  return parse5.serialize(document);
};

module.exports = html;
