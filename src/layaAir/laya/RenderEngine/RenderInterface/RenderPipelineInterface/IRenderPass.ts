import { SingletonList } from "../../../d3/component/SingletonList";
import { IBaseRenderNode } from "./IBaseRenderNode";
import { ICullPass } from "./ICullPass";
import { IRenderQueue } from "./IRenderQueue";

/**
 * 渲染通道
 */
export interface IRenderPass{
    //裁剪工具
    _cullPass:ICullPass;
    //set Render Obj List
    setRenderlist(list:SingletonList<IBaseRenderNode>):void;
    //render Queue
    applyRenderQueue(queue:IRenderQueue):void;
    //update data
    update():void;
    //render element
    render():void;
}