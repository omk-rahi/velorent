$file = "app/(main)/bookings/[id].tsx"
$content = [System.IO.File]::ReadAllText((Join-Path (Get-Location) $file))

# 1. Add useUser import
$old1 = "import { supabase } from `"@/lib/supabase`";`r`nimport { Ionicons } from `"@expo/vendor-icons`";"
$new1 = "import { supabase } from `"@/lib/supabase`";`r`nimport useUser from `"@/store/use-user`";`r`nimport { Ionicons } from `"@expo/vector-icons`";"

# Try CRLF version
$old1_crlf = "import { supabase } from `"@/lib/supabase`";" + [char]13 + [char]10 + "import { Ionicons } from `"@expo/vendor-icons`";"

# Use simple line-by-line approach instead
$lines = $content -split "`r`n"
$newLines = @()
foreach ($line in $lines) {
    if ($line -eq 'import { Ionicons } from "@expo/vendor-icons";') {
        $newLines += 'import useUser from "@/store/use-user";'
        $newLines += $line
    } elseif ($line -eq 'import { Ionicons } from "@expo/vector-icons";') {
        $newLines += 'import useUser from "@/store/use-user";'
        $newLines += $line
    } elseif ($line -eq '  const queryClient = useQueryClient();') {
        $newLines += $line
        $newLines += '  const profile = useUser((s) => s.profile);'
        $newLines += '  const isVerified = profile?.aadhaar_verified === true && profile?.dl_verified === true;'
    } elseif ($line -eq '        {/* OTP Banner for confirmed bookings */}') {
        $newLines += ''
        $newLines += '        {/* Verification alert banner */}'
        $newLines += '        {!isVerified && ('
        $newLines += '          <VStack'
        $newLines += '            style={{'
        $newLines += '              backgroundColor: "#FFFBEB",'
        $newLines += '              borderRadius: 16,'
        $newLines += '              borderWidth: 1,'
        $newLines += '              borderColor: "#FDE68A",'
        $newLines += '              padding: 16,'
        $newLines += '              gap: 10,'
        $newLines += '              marginBottom: 16,'
        $newLines += '            }}'
        $newLines += '          >'
        $newLines += '            <HStack style={{ gap: 10, alignItems: "flex-start" }}>'
        $newLines += '              <Ionicons'
        $newLines += '                name="warning-outline"'
        $newLines += '                size={20}'
        $newLines += '                color="#D97706"'
        $newLines += '                style={{ marginTop: 1 }}'
        $newLines += '              />'
        $newLines += '              <VStack style={{ flex: 1, gap: 4 }}>'
        $newLines += '                <Text'
        $newLines += '                  style={{'
        $newLines += '                    fontSize: 14,'
        $newLines += '                    fontWeight: "700",'
        $newLines += '                    color: "#92400E",'
        $newLines += '                  }}'
        $newLines += '                >'
        $newLines += '                  Identity Verification Required'
        $newLines += '                </Text>'
        $newLines += '                <Text'
        $newLines += '                  style={{'
        $newLines += '                    fontSize: 13,'
        $newLines += '                    color: "#78350F",'
        $newLines += '                    lineHeight: 19,'
        $newLines += '                  }}'
        $newLines += '                >'
        $newLines += '                  Your booking has been confirmed. Please complete your identity'
        $newLines += '                  verification before vehicle pickup to avoid any delays.'
        $newLines += '                </Text>'
        $newLines += '              </VStack>'
        $newLines += '            </HStack>'
        $newLines += '            <Button'
        $newLines += '              size="sm"'
        $newLines += '              style={{'
        $newLines += '                backgroundColor: "#D97706",'
        $newLines += '                borderRadius: 10,'
        $newLines += '                alignSelf: "flex-start",'
        $newLines += '              }}'
        $newLines += '              onPress={() => router.push("/(main)/profile")}'
        $newLines += '            >'
        $newLines += '              <ButtonText style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>'
        $newLines += '                Verify Now'
        $newLines += '              </ButtonText>'
        $newLines += '            </Button>'
        $newLines += '          </VStack>'
        $newLines += '        )}'
        $newLines += ''
        $newLines += $line
    } else {
        $newLines += $line
    }
}

$result = $newLines -join "`r`n"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) $file), $result, [System.Text.Encoding]::UTF8)
Write-Host "Patch applied successfully"
