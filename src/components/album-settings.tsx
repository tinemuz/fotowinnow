"use client"

import type React from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"
import { Slider } from "~/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { useState } from "react"
import type { Album } from "~/lib/data"

interface AlbumSettingsProps {
  album: Album
}

export function AlbumSettings({ album }: AlbumSettingsProps) {
  const [settings, setSettings] = useState({
    isPublic: album.isShared,
    allowComments: true,
    allowDownloads: false,
    watermarkText: "WATERMARK",
    watermarkOpacity: 10,
    watermarkPosition: "center",
    expirationDays: "30",
  })

  const handleSwitchChange = (field: string) => (checked: boolean) => {
    setSettings({ ...settings, [field]: checked })
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [field]: e.target.value })
  }

  const handleSliderChange = (field: string) => (value: number[]) => {
    setSettings({ ...settings, [field]: value[0] })
  }

  const handleSelectChange = (field: string) => (value: string) => {
    setSettings({ ...settings, [field]: value })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visibility & Sharing</CardTitle>
          <CardDescription>Control who can access this album and how it can be shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-album">Public Album</Label>
              <p className="text-sm text-muted-foreground">Make this album accessible via a shared link</p>
            </div>
            <Switch id="public-album" checked={settings.isPublic} onCheckedChange={handleSwitchChange("isPublic")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Link Expiration</Label>
            <Select value={settings.expirationDays} onValueChange={handleSelectChange("expirationDays")}>
              <SelectTrigger id="expiration">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="never">Never expires</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Watermark Settings</CardTitle>
          <CardDescription>Customize how watermarks appear on shared images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watermark-text">Watermark Text</Label>
            <Input id="watermark-text" value={settings.watermarkText} onChange={handleInputChange("watermarkText")} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="watermark-opacity">Opacity</Label>
              <span className="text-sm text-muted-foreground">{settings.watermarkOpacity}%</span>
            </div>
            <Slider
              id="watermark-opacity"
              min={10}
              max={90}
              step={5}
              value={[settings.watermarkOpacity]}
              onValueChange={handleSliderChange("watermarkOpacity")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="watermark-position">Position</Label>
            <Select value={settings.watermarkPosition} onValueChange={handleSelectChange("watermarkPosition")}>
              <SelectTrigger id="watermark-position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Permissions</CardTitle>
          <CardDescription>Control what clients can do with your photos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-comments">Allow Comments</Label>
              <p className="text-sm text-muted-foreground">Let clients add comments to photos</p>
            </div>
            <Switch
              id="allow-comments"
              checked={settings.allowComments}
              onCheckedChange={handleSwitchChange("allowComments")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-downloads">Allow Downloads</Label>
              <p className="text-sm text-muted-foreground">Let clients download watermarked photos</p>
            </div>
            <Switch
              id="allow-downloads"
              checked={settings.allowDownloads}
              onCheckedChange={handleSwitchChange("allowDownloads")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}

