'use strict';
var Cesium = require('cesium');
var clone = require('clone');

var MergeDuplicateProperties = require('../../lib/MergeDuplicateProperties');

var WebGLConstants = Cesium.WebGLConstants;

describe('MergeDuplicateProperties', function() {
    var mergeAccessors = MergeDuplicateProperties.mergeAccessors;
    describe('mergeAccessors', function() {
        var testGltf = {
            accessors: {
                accessorA: {
                    bufferView: 'bufferView',
                    byteOffset: 0,
                    byteStride: 0,
                    componentType: WebGLConstants.BYTE,
                    count: 3,
                    type: 'SCALAR'
                },
                accessorB: {
                    bufferView: 'bufferView',
                    byteOffset: 3,
                    byteStride: 0,
                    componentType: WebGLConstants.BYTE,
                    count: 3,
                    type: 'SCALAR'
                }
            },
            bufferViews: {
                bufferView: {
                    buffer: 'buffer',
                    byteOffset: 0
                }
            },
            buffers: {
                buffer: {
                    type: 'arraybuffer',
                    extras : {
                        _pipeline : {}
                    }
                }
            },
            meshes: {
                meshA: {
                    primitives : [
                        {
                            attributes: {
                                TEST: 'accessorA'
                            }
                        }
                    ]
                },
                meshB: {
                    primitives : [
                        {
                            attributes: {
                                TEST: 'accessorB'
                            }
                        }
                    ]
                }
            }
        };
        it('merges a single duplicate accessor', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers.buffer;
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews.bufferView.byteLength = buffer.length;
            mergeAccessors(gltf);
            expect(Object.keys(gltf.accessors).length).toEqual(1);
            expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
        });

        it ('merges multiple duplicate accessors', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3, 1, 2, 3]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers.buffer;
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews.bufferView.byteLength = buffer.length;
            gltf.accessors.accessorC = {
                bufferView: 'bufferView',
                byteOffset: 6,
                byteStride: 0,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            };
            gltf.meshes.meshC = {
                primitives : [
                    {
                        attributes : {
                            TEST: 'accessorC'
                        }
                    }
                ]
            };
            mergeAccessors(gltf);
            expect(Object.keys(gltf.accessors).length).toEqual(1);
            expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
            expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshC.primitives[0].attributes.TEST);
        });

        it ('leaves a non-duplicate accessor alone', function () {
            var buffer = Buffer.from([1, 2, 3, 1, 2, 3, 3, 2, 1]);
            var gltf = clone(testGltf);
            var gltfBuffer = gltf.buffers.buffer;
            gltfBuffer.extras._pipeline.source = buffer;
            gltfBuffer.byteLength = buffer.length;
            gltf.bufferViews.bufferView.byteLength = buffer.length;
            gltf.accessors.accessorC = {
                bufferView: 'bufferView',
                byteOffset: 6,
                byteStride: 0,
                componentType: WebGLConstants.BYTE,
                count: 3,
                type: 'SCALAR'
            };
            gltf.meshes.meshC = {
                primitives : [
                    {
                        attributes : {
                            TEST: 'accessorC'
                        }
                    }
                ]

            };
            mergeAccessors(gltf);
            expect(Object.keys(gltf.accessors).length).toEqual(2);
            expect(gltf.meshes.meshA.primitives[0].attributes.TEST).toEqual(gltf.meshes.meshB.primitives[0].attributes.TEST);
            expect(gltf.meshes.meshA.primitives[0].attributes.TEST).not.toEqual(gltf.meshes.meshC.primitives[0].attributes.TEST);
        });
    });

    var mergeShaders = MergeDuplicateProperties.mergeShaders;
    describe('mergeShaders', function() {
        var testShaderBufferOne = Buffer.from('test shader one', 'utf8');
        var testShaderBufferTwo = Buffer.from('test shader two', 'utf8');
        it('merges duplicate shaders', function() {
            var gltf = {
                programs : {
                    programOne : {
                        fragmentShader : 'FSOne',
                        vertexShader : 'VSOne'
                    },
                    programTwo : {
                        fragmentShader : 'FSTwo',
                        vertexShader : 'VSTwo'
                    }
                },
                shaders : {
                    VSOne : {
                        type : WebGLConstants.VERTEX_SHADER,
                        extras : {
                            _pipeline : {
                                source : testShaderBufferOne
                            }
                        }
                    },
                    FSOne : {
                        type : WebGLConstants.FRAGMENT_SHADER,
                        extras : {
                            _pipeline : {
                                source : testShaderBufferOne
                            }
                        }
                    },
                    VSTwo : {
                        type : WebGLConstants.VERTEX_SHADER,
                        extras : {
                            _pipeline : {
                                source : testShaderBufferTwo
                            }
                        }
                    },
                    FSTwo : {
                        type : WebGLConstants.FRAGMENT_SHADER,
                        extras : {
                            _pipeline : {
                                source : testShaderBufferOne
                            }
                        }
                    }
                }
            };
            mergeShaders(gltf);
            var programs = gltf.programs;
            expect(programs.programOne.fragmentShader).toBe('FSOne');
            expect(programs.programOne.vertexShader).toBe('VSOne');
            expect(programs.programTwo.fragmentShader).toBe('FSOne');
            expect(programs.programTwo.vertexShader).toBe('VSTwo');
        });
    });

    var mergePrograms = MergeDuplicateProperties.mergePrograms;
    describe('mergePrograms', function() {
        it('merges duplicate programs', function() {
            var gltf = {
                programs: {
                    programOne: {
                        fragmentShader: 'FSOne',
                        vertexShader: 'VSOne'
                    },
                    programTwo: {
                        fragmentShader: 'FSOne',
                        vertexShader: 'VSOne'
                    },
                    programThree: {
                        fragmentShader: 'FSOne',
                        vertexShader: 'VSTwo'
                    }
                },
                techniques: {
                    techniqueOne: {
                        program: 'programOne'
                    },
                    techniqueTwo: {
                        program: 'programTwo'
                    },
                    techniqueThree: {
                        program: 'programThree'
                    }
                }
            };
            mergePrograms(gltf);
            var techniques = gltf.techniques;
            expect(techniques.techniqueOne.program).toBe('programOne');
            expect(techniques.techniqueTwo.program).toBe('programOne');
            expect(techniques.techniqueThree.program).toBe('programThree');
        });
    });

    var mergeTechniques = MergeDuplicateProperties.mergeTechniques;
    describe('mergeTechniques', function() {
        it('merges duplicate techniques', function() {
            var gltf = {
                techniques : {
                    techniqueOne : {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    techniqueTwo : {
                        key : 'value',
                        arrayOf : ['different', 'values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    techniqueThree : {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    }
                },
                materials : {
                    materialOne : {
                        technique : 'techniqueOne'
                    },
                    materialTwo : {
                        technique : 'techniqueTwo'
                    },
                    materialThree : {
                        technique : 'techniqueThree'
                    }
                }
            };
            mergeTechniques(gltf);
            var materials = gltf.materials;
            expect(materials.materialOne.technique).toBe('techniqueOne');
            expect(materials.materialTwo.technique).toBe('techniqueTwo');
            expect(materials.materialThree.technique).toBe('techniqueOne');
        });
    });

    var mergeMaterials = MergeDuplicateProperties.mergeMaterials;
    describe('mergeMaterials', function() {
        it('merges duplicate materials', function() {
            var gltf = {
                meshes : {
                    meshOne : {
                        primitives : [
                            {
                                material : 'materialOne'
                            },
                            {
                                material : 'materialThree'
                            }
                        ]
                    },
                    meshTwo : {
                        primitives : [
                            {
                                material : 'materialTwo'
                            },
                            {
                                material : 'materialThree'
                            }
                        ]
                    }
                },
                materials : {
                    materialOne : {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    materialTwo : {
                        key : 'value',
                        arrayOf : ['different', 'values'],
                        nested : {
                            key : 'value'
                        }
                    },
                    materialThree : {
                        key : 'value',
                        arrayOf : ['values'],
                        nested : {
                            key : 'value'
                        }
                    }
                }
            };
            mergeMaterials(gltf);
            var meshes = gltf.meshes;
            var meshOne = meshes.meshOne;
            var meshOnePrimitives = meshOne.primitives;
            expect(meshOnePrimitives[0].material).toBe('materialOne');
            expect(meshOnePrimitives[1].material).toBe('materialOne');
            var meshTwo = meshes.meshTwo;
            var meshTwoPrimitives = meshTwo.primitives;
            expect(meshTwoPrimitives[0].material).toBe('materialTwo');
            expect(meshTwoPrimitives[1].material).toBe('materialOne');
        });
    });
});