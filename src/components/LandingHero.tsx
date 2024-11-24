'use client'

import { useState, useEffect, useRef } from 'react'
import { ComputerIcon, Download, Usb, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ESPLoader, Transport } from 'esptool-js'
import Header from './Header'
import InstructionPanel from './InstructionPanel'
import Selector from './Selector'
import device_data from './firmware_data.json'

import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

import { serial } from "web-serial-polyfill";

export default function LandingHero() {
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedBoardVersion, setSelectedBoardVersion] = useState('')
  const [selectedFirmware, setSelectedFirmware] = useState('')
  const [status, setStatus] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isChromiumBased, setIsChromiumBased] = useState(true)
  const serialPortRef = useRef<any>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const terminalContainerRef = useRef<HTMLDivElement>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const textDecoderRef = useRef<TextDecoderStream | null>(null)
  const readableStreamClosedRef = useRef<Promise<void> | null>(null)
  const logsRef = useRef<string>('')

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChromium = /chrome|chromium|crios|edge/i.test(userAgent);
    setIsChromiumBased(isChromium);
  }, []);

  useEffect(() => {
    if (terminalContainerRef.current && !terminalRef.current && isLogging) {
      const term = new Terminal({
        cols: 80,
        rows: 24,
        theme: {
          background: '#1a1b26',
          foreground: '#a9b1d6'
        }
      });
      terminalRef.current = term;
      term.open(terminalContainerRef.current);
      term.writeln('Serial logging started...');
      logsRef.current = 'Serial logging started...\n';
    }

    return () => {
      if (terminalRef.current) {
        terminalRef.current.dispose();
        terminalRef.current = null;
      }
    };
  }, [isLogging]);

  const devices = device_data.devices;
  const device = selectedDevice !== ''
    ? devices.find(d => d.name == selectedDevice)!
    : { boards: [] };
  const board = selectedBoardVersion !== ''
    ? device.boards.find(b => b.name == selectedBoardVersion)!
    : { supported_firmware: [] };
  const firmware = selectedFirmware !== ''
    ? board.supported_firmware.find(f => f.version == selectedFirmware)!
    : { path: '' };

  const handleConnect = async () => {
    setIsConnecting(true)
    setStatus('Connecting to device...')

    try {
      const port = await navigator.serial.requestPort()
      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      })

      serialPortRef.current = port
      setIsConnected(true)
      setStatus('Connected successfully!')
    } catch (error) {
      console.error('Connection failed:', error)
      setStatus(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (isLogging) {
      await stopSerialLogging();
    }
    try {
      if (serialPortRef.current?.readable) {
        await serialPortRef.current.close();
      }
      serialPortRef.current = null;
      setIsConnected(false)
      setStatus("")
    } catch (error) {
      console.error('Disconnect error:', error);
      setStatus(`Disconnect error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const startSerialLogging = async () => {
    if (!serialPortRef.current) {
      setStatus('Please connect to a device first');
      return;
    }

    try {
      setIsLogging(true);
      const port = serialPortRef.current;

      // First ensure any existing connections are cleaned up
      if (readerRef.current) {
        await readerRef.current.cancel();
      }
      if (readableStreamClosedRef.current) {
        await readableStreamClosedRef.current;
      }

      // Set up text decoder stream
      const decoder = new TextDecoderStream();
      const inputDone = port.readable.pipeTo(decoder.writable);
      const inputStream = decoder.readable;
      const reader = inputStream.getReader();

      textDecoderRef.current = decoder;
      readableStreamClosedRef.current = inputDone;
      readerRef.current = reader;

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            break;
          }
          terminalRef.current?.write(value);
          logsRef.current += value;
        }
      } catch (error) {
        console.error('Error in read loop:', error);
      }
    } catch (error) {
      console.error('Serial logging error:', error);
      setStatus(`Logging error: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsLogging(false);
  };

  const stopSerialLogging = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (readableStreamClosedRef.current) {
        await readableStreamClosedRef.current;
        readableStreamClosedRef.current = null;
      }
      if (textDecoderRef.current) {
        textDecoderRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping serial logging:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([logsRef.current], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `bitaxe-logs-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleStartFlashing = async () => {
    if (!serialPortRef.current) {
      setStatus('Please connect to a device first')
      return
    }

    if (!selectedDevice || !selectedBoardVersion) {
      setStatus('Please select both device model and board version')
      return
    }

    setIsFlashing(true)
    setStatus('Preparing to flash...')

    try {
      // Stop logging if it's active
      if (isLogging) {
        await stopSerialLogging();
      }

      // Close the current connection
      if (serialPortRef.current.readable) {
        await serialPortRef.current.close();
      }

      // Create transport and ESPLoader for flashing
      const transport = new Transport(serialPortRef.current);
      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        romBaudrate: 115200,
        terminal: {
          clean() { },
          writeLine(data: string) {
            setStatus(data);
          },
          write(data: string) {
            setStatus(data);
          },
        },
      });

      await loader.main();

      if (!firmware) {
        throw new Error('No firmware available for the selected device and board version')
      }

      const firmwareResponse = await fetch(firmware.path)
      if (!firmwareResponse.ok) {
        throw new Error('Failed to load firmware file')
      }

      const firmwareArrayBuffer = await firmwareResponse.arrayBuffer()
      const firmwareUint8Array = new Uint8Array(firmwareArrayBuffer)
      const firmwareBinaryString = Array.from(firmwareUint8Array, (byte) => String.fromCharCode(byte)).join('')

      setStatus('Flashing firmware...')

      await loader.writeFlash({
        fileArray: [{
          data: firmwareBinaryString,
          address: 0
        }],
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (fileIndex, written, total) => {
          setStatus(`Flashing: ${Math.round((written / total) * 100)}% complete`)
        },
        calculateMD5Hash: () => '',
      })

      setStatus('Flashing completed. Restarting device...')
      await loader.hardReset()

      setStatus('Flashing completed successfully! Device has been restarted.')
    } catch (error) {
      console.error('Flashing failed:', error)
      setStatus(`Flashing failed: ${error instanceof Error ? error.message : String(error)}. Please try again.`)
    } finally {
      setIsFlashing(false)
    }
  }

  if (!isChromiumBased) {
    return (
      <div className="container px-4 md:px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none mb-4">
          Browser Compatibility Error
        </h1>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
          This application requires a Chromium-based browser (such as Google Chrome, Microsoft Edge, or Brave) to function properly. Please switch to a compatible browser and try again.
        </p>
      </div>
    )
  }

  return (
    <>
      <Header onOpenPanel={() => setIsPanelOpen(true)} />
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Flash Your Bitaxe Directly from the Web
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Connect your device, select your model and board version, and start flashing immediately. No setup required.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Button
                className="w-full"
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={isConnecting || isFlashing}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
                <Usb className="ml-2 h-4 w-4" />
              </Button>
              <Selector
                placeholder="Select device"
                values={devices.map(d => d.name)}
                onValueChange={(value) => {
                  setSelectedDevice(value)
                  setSelectedBoardVersion('')
                  setSelectedFirmware('')
                }}
                disabled={isConnecting || isFlashing || !isConnected}
              />
              {selectedDevice && (
                <Selector
                  placeholder="Select board version"
                  values={device.boards.map(b => b.name)}
                  onValueChange={(value) => {
                    setSelectedBoardVersion(value)
                    setSelectedFirmware('')
                  }}
                  disabled={isConnecting || isFlashing}
                />
              )}
              {selectedBoardVersion && (
                <Selector
                  placeholder="Select firmware version"
                  values={board.supported_firmware.map(f => f.version)}
                  onValueChange={setSelectedFirmware}
                  disabled={isConnecting || isFlashing}
                />
              )}
              <Button
                className="w-full"
                onClick={handleStartFlashing}
                disabled={!selectedDevice || !selectedBoardVersion || isConnecting || isFlashing || !isConnected}
              >
                {isFlashing ? 'Flashing...' : 'Start Flashing'}
                <Zap className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={isLogging ? stopSerialLogging : startSerialLogging}
                  disabled={!isConnected || isFlashing}
                >
                  {isLogging ? 'Stop Logging' : 'Start Logging'}
                  <ComputerIcon className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  className="flex-1"
                  onClick={downloadLogs}
                  disabled={!logsRef.current}
                >
                  Download Logs
                  <Download className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="mx-auto max-w-[400px] text-gray-500 md:text-m dark:text-gray-400">
                Connect your device, log the serial data and download it later on.
              </p>
              {status && <p className="mt-2 text-sm font-medium">{status}</p>}
            </div>
            {isLogging && (
              <div
                ref={terminalContainerRef}
                className="w-full max-w-4xl h-[400px] bg-black rounded-lg overflow-hidden mt-8 border border-gray-700 text-left"
              />
            )}
          </div>
        </div>
      </section>
      <InstructionPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
    </>
  )
}
