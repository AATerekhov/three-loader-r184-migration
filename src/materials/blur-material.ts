import { ShaderMaterial, Texture } from 'three';
import { IUniform } from './types';
import vertexBlurSource from './shaders/blur.vert';
import fragmentblurSource from './shaders/blur.frag';

// see http://john-chapman-graphics.blogspot.co.at/2013/01/ssao-tutorial.html

export interface IBlurMaterialUniforms {
  [name: string]: IUniform<any>;
  screenWidth: IUniform<number>;
  screenHeight: IUniform<number>;
  map: IUniform<Texture | null>;
}

export class BlurMaterial extends ShaderMaterial {
  vertexShader = vertexBlurSource;
  fragmentShader = fragmentblurSource;
  uniforms: IBlurMaterialUniforms = {
    screenWidth: { type: 'f', value: 0 },
    screenHeight: { type: 'f', value: 0 },
    map: { type: 't', value: null },
  };
}
