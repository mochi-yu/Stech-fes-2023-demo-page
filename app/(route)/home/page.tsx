'use client'

import { Container, Stack } from "@mui/material"
import { useEffect, useRef, useState } from "react";

import SignaturePad from "signature_pad";
import type { PointGroup } from "signature_pad";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const PreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [previewSignaturePad, setPreviewSignaturePad] = useState<SignaturePad>();
  const [displayData, setDisplayData] = useState<PointGroup[]>([]);

  const [editMode, setEditMode] = useState<"draw" | "erase">("draw");
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [editorSignaturePad, setEditorSignaturePad] = useState<SignaturePad>();
  
  const [windowWidth, setWindowWidth] = useState<number>();

  const readyPad = () => {
    if (!PreviewCanvasRef.current) return;
    const tempPreviewSignaturePad = new SignaturePad(PreviewCanvasRef.current, {
      backgroundColor: "rgb(255, 255, 255)",
    });
    setPreviewSignaturePad(tempPreviewSignaturePad);
    
    if (!editorCanvasRef.current) return;
    const tempEditorSignaturePad = new SignaturePad(editorCanvasRef.current, {
      backgroundColor: "rgb(255, 255, 255)",
    });
    setEditorSignaturePad(tempEditorSignaturePad);
  };

  useEffect(() => {
    if (!previewSignaturePad) readyPad();
    setWindowWidth(window.screen.width)
  }, [previewSignaturePad]);

  // 描画用の関数
  const draw = async (strokes: PointGroup[]) => {
    if (!PreviewCanvasRef.current) return;
    if (!previewSignaturePad) return;

    let beforeTime = strokes[0].points[0].time;

    for (const stroke of strokes) {
      const beforeStroke = previewSignaturePad.toData();
      const nowStroke = { ...stroke };
      nowStroke.points = [];

      for (let j = 0; j < stroke.points.length; j++) {
        const waitTime = stroke.points[j].time - beforeTime;
        nowStroke.points.push(stroke.points[j]);
        previewSignaturePad.fromData([...beforeStroke, nowStroke] as PointGroup[]);
        await sleep(waitTime);
        beforeTime = stroke.points[j].time;
      }
    }
  };

  // 表示発火用のハンドラー
  const handleDisplay = async () => {
    if (!editorSignaturePad) return;
    const data = editorSignaturePad.toData().map((pointGroup) => {
      return {
        ...pointGroup,
        points: pointGroup.points.map((point) => {
          return {
            x: point.x,
            y: point.y,
            time: point.time,
          };
        }),
      };
    }) as PointGroup[];
    setDisplayData(data);
    draw(data);
  }

  // キャンバスクリア用のハンドラー
  const handleClear = () => {
    handleDraw();
    sleep(5)
    if (!editorSignaturePad) return;
    editorSignaturePad.clear();
    if (!previewSignaturePad) return;
    previewSignaturePad.clear();
  };

  // 消しゴムに変更用のハンドラー
  const handleErase = () => {
    if (!editorSignaturePad) return;
    editorSignaturePad.compositeOperation = "destination-out";
    editorSignaturePad.minWidth = editorSignaturePad.maxWidth = 10;
    setEditMode("erase");
  };

  const handleDraw = () => {
    if (!editorSignaturePad) return;
    editorSignaturePad.compositeOperation = "source-over";
    editorSignaturePad.minWidth = 1;
    editorSignaturePad.maxWidth = 2;
    setEditMode("draw");
  };

  return (
    <>
      {windowWidth && 
        <Stack spacing={3}>
          <div className="grid w-full place-content-center gap-2">
            <p className="font-bold">入力欄</p>
            <canvas
              className="mx-auto rounded-lg border border-blue-400"
              ref={editorCanvasRef}
              width={
                windowWidth * 0.9 < 600 ? windowWidth * 0.9 : 600
              }
              height={300}
            />
            <div className="flex justify-center gap-2">
              <button
                className={`rounded-xl ${
                  editMode === "erase" ? "bg-blue-500" : "bg-blue-400"
                } px-4 py-2 text-white`}
                onClick={handleErase}
                aria-label="消しゴムモードに切り替え"
              >
                消しゴム
              </button>
              <button
                className={`rounded-xl ${
                  editMode === "draw" ? "bg-blue-500" : "bg-blue-400"
                } px-4 py-2 text-white`}
                onClick={handleDraw}
                aria-label="ペンモードに切り替え"
              >
                書く
              </button>
              <button
                className="rounded-xl bg-red-500 px-4 py-2 text-white"
                onClick={handleClear}
                aria-label="クリア"
              >
                クリア
              </button>
              <button
                className="rounded-xl bg-purple-500 px-4 py-2 text-white"
                onClick={handleDisplay}
                aria-label="表示"
              >
                表示
              </button>
            </div>
          </div>

          <div className="grid w-full place-content-center gap-2" id="signature-pad">
            <canvas
              className="w-full border border-black"
              ref={PreviewCanvasRef}
              width={
                windowWidth * 0.9 < 600 ? windowWidth * 0.9 : 600
              }
              height={300}
            />
          </div>
        </Stack>
      }
    </>
  )
}