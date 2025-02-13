import { AlphaCmd } from "./cmd/AlphaCmd"
import { DrawCircleCmd } from "./cmd/DrawCircleCmd"
import { DrawCurvesCmd } from "./cmd/DrawCurvesCmd"
import { DrawImageCmd } from "./cmd/DrawImageCmd"
import { DrawLineCmd } from "./cmd/DrawLineCmd"
import { DrawLinesCmd } from "./cmd/DrawLinesCmd"
import { DrawPathCmd } from "./cmd/DrawPathCmd"
import { DrawPieCmd } from "./cmd/DrawPieCmd"
import { DrawPolyCmd } from "./cmd/DrawPolyCmd"
import { DrawRectCmd } from "./cmd/DrawRectCmd"
import { DrawTextureCmd } from "./cmd/DrawTextureCmd"
import { FillTextureCmd } from "./cmd/FillTextureCmd"
import { RestoreCmd } from "./cmd/RestoreCmd"
import { RotateCmd } from "./cmd/RotateCmd"
import { ScaleCmd } from "./cmd/ScaleCmd"
import { TransformCmd } from "./cmd/TransformCmd"
import { TranslateCmd } from "./cmd/TranslateCmd"
import { GrahamScan } from "../maths/GrahamScan"
import { Matrix } from "../maths/Matrix"
import { Point } from "../maths/Point"
import { Rectangle } from "../maths/Rectangle"
import { Pool } from "../utils/Pool"
import { Utils } from "../utils/Utils"
import { Graphics } from "./Graphics";
import { DrawTrianglesCmd } from "./cmd/DrawTrianglesCmd";
import { Draw9GridTextureCmd } from "./cmd/Draw9GridTextureCmd";
import { SaveCmd } from "./cmd/SaveCmd"

const _tempMatrix: Matrix = new Matrix();
const _initMatrix: Matrix = new Matrix();
const _tempMatrixArrays: any[] = [];

/**
 * @private
 * Graphic bounds数据类
 */
export class GraphicsBounds {
    /**@private */
    private _temp: any[];
    /**@private */
    private _bounds: Rectangle;
    /**@private */
    private _rstBoundPoints: any[];
    /**@private */
    private _cacheBoundsType: boolean = false;
    /**@internal */
    _graphics: Graphics;

    /**
     * 销毁
     */
    destroy(): void {
        this._graphics = null;
        this._cacheBoundsType = false;
        if (this._temp) this._temp.length = 0;
        if (this._rstBoundPoints) this._rstBoundPoints.length = 0;
        if (this._bounds) this._bounds.recover();
        this._bounds = null;
        Pool.recover("GraphicsBounds", this);
    }

    /**
     * 创建
     */
    static create(): GraphicsBounds {
        return Pool.getItemByClass("GraphicsBounds", GraphicsBounds);
    }

    /**
     * 重置数据
     */
    reset(): void {
        this._temp && (this._temp.length = 0);
    }

    /**
     * 获取位置及宽高信息矩阵(比较耗CPU，频繁使用会造成卡顿，尽量少用)。
     * @param realSize	（可选）使用图片的真实大小，默认为false
     * @return 位置与宽高组成的 一个 Rectangle 对象。
     */
    getBounds(realSize: boolean = false): Rectangle {
        if (!this._bounds || !this._temp || this._temp.length < 1 || realSize != this._cacheBoundsType) {
            this._bounds = Rectangle._getWrapRec(this.getBoundPoints(realSize), this._bounds)
        }
        this._cacheBoundsType = realSize;
        return this._bounds;
    }

    /**
     * @private
     * @param realSize	（可选）使用图片的真实大小，默认为false
     * 获取端点列表。
     */
    getBoundPoints(realSize: boolean = false): any[] {
        if (!this._temp || this._temp.length < 1 || realSize != this._cacheBoundsType)
            this._temp = this._getCmdPoints(realSize);
        this._cacheBoundsType = realSize;
        return this._rstBoundPoints = Utils.copyArray(this._rstBoundPoints, this._temp);
    }

    private _getCmdPoints(realSize: boolean = false): any[] {
        let cmds = this._graphics.cmds;
        let sp = this._graphics._sp;
        let rst: any[];
        rst = this._temp || (this._temp = []);
        rst.length = 0;
        if (cmds.length == 0) return rst;

        let matrixs: any[] = _tempMatrixArrays;
        matrixs.length = 0;
        let tMatrix: Matrix = _initMatrix;
        tMatrix.identity();
        let tempMatrix: Matrix = _tempMatrix;
        for (let i = 0, n = cmds.length; i < n; i++) {
            let cmd = cmds[i];
            switch (cmd.cmdID) {
                case AlphaCmd.ID:
                case SaveCmd.ID:
                    matrixs.push(tMatrix);
                    tMatrix = tMatrix.clone();
                    break;
                case RestoreCmd.ID: //restore
                    tMatrix = matrixs.pop();
                    break;
                case ScaleCmd.ID:
                    tempMatrix.identity();
                    tempMatrix.translate(-cmd.pivotX, -cmd.pivotY);
                    tempMatrix.scale(cmd.scaleX, cmd.scaleY);
                    tempMatrix.translate(cmd.pivotX, cmd.pivotY);

                    this._switchMatrix(tMatrix, tempMatrix);
                    break;
                case RotateCmd.ID:
                    tempMatrix.identity();
                    tempMatrix.translate(-cmd.pivotX, -cmd.pivotY);
                    tempMatrix.rotate(cmd.angle);
                    tempMatrix.translate(cmd.pivotX, cmd.pivotY);

                    this._switchMatrix(tMatrix, tempMatrix);
                    break;
                case TranslateCmd.ID:
                    tempMatrix.identity();
                    tempMatrix.translate(cmd.tx, cmd.ty);

                    this._switchMatrix(tMatrix, tempMatrix);
                    break;
                case TransformCmd.ID:
                    tempMatrix.identity();
                    tempMatrix.translate(-cmd.pivotX, -cmd.pivotY);
                    tempMatrix.concat(cmd.matrix);
                    tempMatrix.translate(cmd.pivotX, cmd.pivotY);

                    this._switchMatrix(tMatrix, tempMatrix);
                    break;
                case DrawImageCmd.ID:
                case FillTextureCmd.ID:
                    addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, cmd.width, cmd.height), tMatrix);
                    break;
                case DrawTextureCmd.ID:
                    tMatrix.copyTo(tempMatrix);
                    if (cmd.matrix)
                        tempMatrix.concat(cmd.matrix);
                    addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, cmd.width, cmd.height), tempMatrix);
                    break;
                // case DrawImageCmd.ID:
                //     {
                //         let tex = cmd.texture;
                //         if (realSize) {
                //             if (cmd.width && cmd.height) {
                //                 addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, cmd.width, cmd.height), tMatrix);
                //             } else {
                //                 addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, tex.width, tex.height), tMatrix);
                //             }
                //         } else {
                //             var wRate: number = (cmd.width || tex.sourceWidth) / tex.width;
                //             var hRate: number = (cmd.height || tex.sourceHeight) / tex.height;
                //             var oWidth: number = wRate * tex.sourceWidth;
                //             var oHeight: number = hRate * tex.sourceHeight;

                //             var offX: number = tex.offsetX > 0 ? tex.offsetX : 0;
                //             var offY: number = tex.offsetY > 0 ? tex.offsetY : 0;

                //             offX *= wRate;
                //             offY *= hRate;

                //             addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x - offX, cmd.y - offY, oWidth, oHeight), tMatrix);
                //         }
                //     }
                //     break;
                // case FillTextureCmd.ID:
                //     addPointArrToRst(rst, (<FillTextureCmd>cmd).getBoundPoints(sp), tMatrix);
                //     break;
                // case DrawTextureCmd.ID:
                //     {
                //         let drawMatrix: Matrix;
                //         if (cmd.matrix) {
                //             tMatrix.copyTo(tempMatrix);
                //             tempMatrix.concat(cmd.matrix);
                //             drawMatrix = tempMatrix;
                //         } else {
                //             drawMatrix = tMatrix;
                //         }
                //         if (realSize) {
                //             if (cmd.width && cmd.height) {
                //                 addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, cmd.width, cmd.height), drawMatrix);
                //             } else {
                //                 let tex = cmd.texture;
                //                 addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x, cmd.y, tex.width, tex.height), drawMatrix);
                //             }
                //         } else {
                //             let tex = cmd.texture;
                //             wRate = (cmd.width || tex.sourceWidth) / tex.width;
                //             hRate = (cmd.height || tex.sourceHeight) / tex.height;
                //             oWidth = wRate * tex.sourceWidth;
                //             oHeight = hRate * tex.sourceHeight;

                //             offX = tex.offsetX > 0 ? tex.offsetX : 0;
                //             offY = tex.offsetY > 0 ? tex.offsetY : 0;

                //             offX *= wRate;
                //             offY *= hRate;

                //             addPointArrToRst(rst, Rectangle._getBoundPointS(cmd.x - offX, cmd.y - offY, oWidth, oHeight), drawMatrix);
                //         }
                //     }
                //     break;
                case DrawRectCmd.ID:
                    addPointArrToRst(rst, (<DrawRectCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
                case DrawCircleCmd.ID:
                    addPointArrToRst(rst, (<DrawCircleCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
                case DrawLineCmd.ID:
                    addPointArrToRst(rst, (<DrawLineCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
                case DrawCurvesCmd.ID:
                    addPointArrToRst(rst, (<DrawCurvesCmd>cmd).getBoundPoints(sp), tMatrix, cmd.x, cmd.y);
                    break;
                case DrawLinesCmd.ID:
                case DrawPolyCmd.ID:
                    addPointArrToRst(rst, cmd.points, tMatrix, cmd.x, cmd.y);
                    break;
                case DrawPathCmd.ID:
                    addPointArrToRst(rst, (<DrawPathCmd>cmd).getBoundPoints(sp), tMatrix, cmd.x, cmd.y);
                    break;
                case DrawPieCmd.ID:
                    addPointArrToRst(rst, (<DrawPieCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
                case DrawTrianglesCmd.ID:
                    addPointArrToRst(rst, (<DrawTrianglesCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
                case Draw9GridTextureCmd.ID:
                    addPointArrToRst(rst, (<Draw9GridTextureCmd>cmd).getBoundPoints(sp), tMatrix);
                    break;
            }
        }
        if (rst.length > 200) {
            rst = Utils.copyArray(rst, Rectangle._getWrapRec(rst)._getBoundPoints());
        } else if (rst.length > 8)
            rst = GrahamScan.scanPList(rst);
        return rst;
    }

    private _switchMatrix(tMatix: Matrix, tempMatrix: Matrix): void {
        tempMatrix.concat(tMatix);
        tempMatrix.copyTo(tMatix);
    }
}

function addPointArrToRst(rst: any[], points: any[], matrix: Matrix, dx: number = 0, dy: number = 0): void {
    let len = points.length;
    for (let i = 0; i < len; i += 2) {
        addPointToRst(rst, points[i] + dx, points[i + 1] + dy, matrix);
    }
}

function addPointToRst(rst: any[], x: number, y: number, matrix: Matrix): void {
    var _tempPoint: Point = Point.TEMP;
    _tempPoint.setTo(x ? x : 0, y ? y : 0);
    matrix.transformPoint(_tempPoint);
    rst.push(_tempPoint.x, _tempPoint.y);
}