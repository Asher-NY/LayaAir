import { LayaGL } from "../../../layagl/LayaGL";
import { ISceneRenderManager } from "../../../RenderEngine/RenderInterface/RenderPipelineInterface/ISceneRenderManager";
import { BaseRender } from "../render/BaseRender";

export class SceneRenderManager {
    protected _sceneManagerOBJ: ISceneRenderManager;
    constructor() {
        this._sceneManagerOBJ = LayaGL.renderOBJCreate.createSceneRenderManager();
    }

    /**
     * get RenderList
     */
    get list() {
        return this._sceneManagerOBJ.list;
    }

    set list(value) {
        this._sceneManagerOBJ.list = value;
    }
    
    /**
     * add Render Node
     * @param object 
     */
    addRenderObject(object: BaseRender): void {
        this._sceneManagerOBJ.addRenderObject(object);
    }

    /**
     * remove Render Node
     * @param object 
     */
    removeRenderObject(object: BaseRender): void {
        this._sceneManagerOBJ.removeRenderObject(object);
    }

    /**
     * remove motion Object
     * @param object 
     */
    removeMotionObject(object: BaseRender): void {
        this._sceneManagerOBJ.removeMotionObject(object);
    }

    /**
     * update All Motion Render Data
     */
    updateMotionObjects(): void {
        this._sceneManagerOBJ.updateMotionObjects();
    }

    /**
     * add motion Render Data
     * @param object 
     */
    addMotionObject(object: BaseRender): void {
        this._sceneManagerOBJ.addMotionObject(object);
    }

    /**
     * destroy
     */
    destroy(): void {
        this._sceneManagerOBJ.destroy();
    }

}